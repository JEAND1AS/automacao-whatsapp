const { Boom } = require("@hapi/boom");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const Tesseract = require("tesseract.js");
const { JWT } = require("google-auth-library");

const creds = require("./credenciais.json"); /* RECOMENDO QUE RENOMEIO SEU ARQUIVO PARA credenciais.json */
const docId = "ID_PLANILHA"; /* Aqui é o ID da sua planilha https://docs.google.com/spreadsheets/d/aqui_é_seu_ID/edit?gid=0#gid=0*/
const processedMessages = new Set();

// ✅ ADICIONA GASTO
async function adicionarNaPlanilha(produto, valor, cartao, parcelas) {
  const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(docId, serviceAccountAuth);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  await sheet.addRow({
    Data: new Date().toLocaleString(),
    Produto: produto,
    Valor: parseFloat(valor.replace(",", ".")), // ✅ Salva como número real
    Cartão: cartao,
    Parcelas: parcelas || null,
  });

  console.log("✔️ Gasto registrado na planilha!");
}

// ✅ CONSULTA TOTAL
async function consultarTotalDoMes(nomeAba) {
  const serviceAccountAuth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const doc = new GoogleSpreadsheet(docId, serviceAccountAuth);
  await doc.loadInfo();

  const aba = Object.values(doc.sheetsByTitle).find((sheet) =>
    sheet.title.toLowerCase().includes(nomeAba.toLowerCase())
  );

  if (!aba) throw new Error(`❌ Aba "${nomeAba}" não encontrada.`);

  const rows = await aba.getRows();
  let total = 0;

  for (const row of rows) {
    const raw = row._rawData;
    const precoBruto = raw[2];

    if (!precoBruto) continue;

    let preco = precoBruto;
    if (typeof preco === "string") {
      preco = preco.replace(/[^\d,.-]/g, "").replace(",", ".");
    }

    const valor = parseFloat(preco);
    if (!isNaN(valor)) total += valor;
  }

  return total.toFixed(2);
}

// ✅ BOT PRINCIPAL
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info");

  const sock = makeWASocket({
    auth: state,
    browser: ["Ubuntu", "Chrome", "120.0.0"],
  });

  const grupoControleGastos = "ID_DO_BATEPAPO";   /* voce utiliza  if (jid.endsWith("@g.us")) {
    console.log("🆔 ID do grupo:", jid);
  }  sock.ev.on("messages.upsert" */

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) qrcode.generate(qr, { small: true });

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log("🔌 Conexão fechada. Reconectando:", shouldReconnect);
      if (shouldReconnect) connectToWhatsApp();
    } else if (connection === "open") {
      console.log("✅ Conectado ao WhatsApp!");
      console.log("Comece enviando uma mensagem ao grupo");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    const messageId = msg.key.id;

    if (processedMessages.has(messageId)) return;
    processedMessages.add(messageId);

    if (!msg.message || !msg.key.remoteJid?.endsWith("@g.us")) return;

    const jid = msg.key.remoteJid;
    const texto =
      msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";
    const imagem = msg.message?.imageMessage;

    // 📊 Comando total da fatura
    if (texto.toLowerCase().startsWith("total")) {
      const partes = texto.split(" ");
      const mes = partes[1];

      try {
        const total = await consultarTotalDoMes(mes);
        await sock.sendMessage(jid, {
          text: `💳 Total da fatura para ${mes.toUpperCase()}: R$ ${total}`,
        });
      } catch (err) {
        await sock.sendMessage(jid, {
          text: err.message || "❌ Erro ao consultar total.",
        });
      }

      return;
    }

    // 💬texto.startsWith faz o bot IGNORAR mensagens que contém esses icones ou escritas dentro.
    if (jid === grupoControleGastos) {
      if (texto) {
        if (
          texto.startsWith("✅") ||
          texto.startsWith("⚠️") ||
          texto.startsWith("❌") ||
          texto.startsWith("💳") ||
          texto.startsWith("total página1")
        )
          return;

        const textoLimpo = texto.replace(/[–—]/g, "-");
        const partes = textoLimpo
          .toUpperCase()
          .split("-")
          .map((p) => p.trim());

        console.log("Partes detectadas:", partes);

        if (partes.length === 4) {
          const [produto, valor, cartao, Parcelas] = partes;
          const valorNumerico = parseFloat(valor.replace(",", "."));
          if (isNaN(valorNumerico)) {
            await sock.sendMessage(jid, {
              text: "❌ Valor inválido! Use número. Ex: produto - valor - método - parcela",
            });
            return;
          }

          try {
            await adicionarNaPlanilha(produto, valor, cartao, Parcelas);
            await sock.sendMessage(jid, {
              text: `✅ Gasto adicionado à planilha!\n\n*Produto:* ${produto}\n*Valor:* R$ ${valor}\n*Cartão:* _${cartao}_\n*Parcelas:* ${Parcelas}`
            });
          } catch (error) {
            console.error("❌ Erro CRÍTICO ao salvar:", error);
            await sock.sendMessage(jid, {
              text: "❌ Erro ao salvar na planilha. Verifique o console.",
            });
          }
        } else {
          await sock.sendMessage(jid, {
            text: "⚠️ Formato inválido! Envie no formato:\n`produto - valor - método - parcela`\nEx: `pizza - 30.5 - nubank - Abril de 2026`",
          });
        }
      }

      // 📷 OCR por imagem
      else if (imagem) {
        try {
          await sock.sendMessage(jid, { text: "⏳ Processando imagem..." });
          const buffer = await downloadMediaMessage(msg, "buffer", {});
          console.log("📸 Imagem recebida. Processando OCR...");

          const resultado = await Tesseract.recognize(buffer, "por");
          console.log("📄 OCR concluído.");

          const textoExtraido = resultado.data.text;
          await sock.sendMessage(jid, {
            text: `📝 Texto extraído:\n\n${textoExtraido}`,
          });

          const linhas = textoExtraido
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          const regex =
            /^(.+?)\s+([\d,.]+)\s+(CRÉDITO|DÉBITO|CARTÃO|DINHEIRO|BOLETO)$/i;
          let registros = 0;

          for (const linha of linhas) {
            const match = linha.match(regex);
            if (match) {
              const produto = match[1];
              const valor = match[2].replace(",", ".");
              const cartao = match[3].toUpperCase();
              const Parcelas = match[3].toUpperCase();
              await adicionarNaPlanilha(produto, valor, cartao, Parcelas);
              registros++;
            }
          }

          if (registros > 0) {
            await sock.sendMessage(jid, {
              text: `✅ ${registros} gasto(s) da fatura foram adicionados à planilha.`,
            });
          } else {
            await sock.sendMessage(jid, {
              text: "⚠️ Nenhum gasto encontrado na imagem da fatura.",
            });
          }
        } catch (error) {
          console.error("❌ Erro ao processar imagem com OCR:", error);
          await sock.sendMessage(jid, {
            text: "❌ Ocorreu um erro ao tentar ler a imagem da fatura.",
          });
        }
      }
    }
  });
}

connectToWhatsApp();
