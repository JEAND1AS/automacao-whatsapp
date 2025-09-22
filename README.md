# 💸 Bot de Controle de Gastos via WhatsApp + Google Sheets

Este projeto é um bot inteligente que escuta mensagens de um **grupo do WhatsApp** e registra automaticamente seus **gastos em uma planilha do Google Sheets**.

✅ Suporta leitura via texto  
✅ Faz OCR em faturas por imagem  
✅ Permite comando `/total mês` para somar valores  
✅ Ideal para uso pessoal, em casal ou em grupos de finanças


<img width="928" height="1600" alt="image" src="https://github.com/user-attachments/assets/148a7a86-a227-4339-814d-1e035f5bff8f" />


---

## 📦 Requisitos

- Node.js **18 ou superior**
- Conta no [Google Cloud Console](https://console.cloud.google.com/)
- Conta do [Google Sheets](https://sheets.google.com/)
- WhatsApp Web ativo com QR Code

---

## 🚀 Como rodar

### 1. Clone o projeto

```bash
git clone https://github.com/seu-usuario/whatsapp-planilha.git
cd whatsapp-planilha
```

### 2. Instale as dependências

```bash
npm install
```

## 🛠 Como Gerar o credenciais.json e configurar o google sheets

# 📘 Guia Completo: Como Gerar o `credentials.json` para o Bot de WhatsApp + Google Sheets

Este passo a passo ensina como criar e configurar uma Conta de Serviço no Google Cloud para acessar o Google Sheets com seu bot.

---

## ✅ Parte 1: Criar ou Selecionar um Projeto no Google Cloud

1. Acesse o Google Cloud Console:  
   👉 https://console.cloud.google.com/

2. Clique no seletor de projetos no topo da tela.

3. Crie um novo projeto (ex: `bot-whatsapp-api`) ou selecione um existente.

---

## ✅ Parte 2: Ativar as APIs Necessárias

1. Vá no menu ☰ > **APIs e Serviços > Biblioteca**.

2. Ative as seguintes APIs:

   - 🔹 `Google Sheets API`
   - 🔹 `Google Drive API`

---

## ✅ Parte 3: Criar a Conta de Serviço (Service Account)

1. Vá em ☰ > **APIs e Serviços > Credenciais**.

2. Clique em **+ CRIAR CREDENCIAIS** > **Conta de serviço**.

3. Preencha os dados:

   - Nome: `bot-planilhas`
   - Descrição: `Conta para acessar planilhas do Google via bot`

4. Clique em **CRIAR E CONTINUAR**.

5. Na etapa de permissões, selecione:  
   📋 Papel: `Editor` (Project > Editor)

6. Clique em **CONCLUÍDO**.

---

## ✅ Parte 4: Gerar e Baixar a Chave JSON

1. Na lista de contas de serviço, clique na conta criada.

2. Vá até a aba **CHAVES**.

3. Clique em **ADICIONAR CHAVE > Criar nova chave**.

4. Selecione o tipo **JSON** e clique em **CRIAR**.

5. O arquivo será baixado automaticamente. Guarde-o com segurança!

---

## ✅ Parte 5: Usar o Arquivo `credentials.json` no Bot

1. Renomeie o arquivo baixado para `credenciais.json`.

2. Coloque ele na raiz do seu projeto Node.js.

3. No seu código, conecte usando:

```js
const creds = require("./credenciais.json");
```

4. Copie o valor de `client_email` do JSON.

5. Abra a planilha no Google Sheets e clique em **Compartilhar**.

6. Cole o e-mail da conta de serviço e dê permissão de **Editor**.

✅ Agora seu bot tem acesso total à planilha!

---

## 🧠 Dica de Segurança

- **NUNCA** compartilhe seu `credenciais.json` publicamente.
- Adicione o arquivo ao `.gitignore` se for usar o GitHub.

---

Pronto! Agora seu bot pode ler e escrever no Google Sheets com segurança e autonomia 🚀

---

6. Salve o arquivo como:

```
credenciais.json
```

> **Importante**: Compartilhe a planilha com o e-mail da conta de serviço (ex: `meu-bot@meuprojeto.iam.gserviceaccount.com`)

---

### 4. Configure sua planilha no Google Sheets

1. Crie uma planilha com o seguinte cabeçalho na linha 1:

```
Data | Produto | Valor | Cartão | Parcelas
```

2. Copie o ID da URL da planilha:

```
https://docs.google.com/spreadsheets/d/**SEU_ID_AQUI**/edit
```

3. Cole no seu código no arquivo `index.js`:

```js
const docId = "SEU_ID_AQUI";
```

---

### 5. Obtenha o ID do grupo do WhatsApp

1. Comente temporariamente no seu código a linha:

```js
// const grupoControleGastos = "ID_DO_BATEPAPO";
```

2. No evento `messages.upsert`, já existe esse trecho:

```js
if (jid.endsWith("@g.us")) {
  console.log("🆔 ID do grupo:", jid);
}
```

3. Mande uma mensagem no grupo desejado → o ID aparecerá no terminal:

```
🆔 ID do grupo: 12036340XXXXXXXX@g.us
```

4. Copie e cole no seu código:

```js
const grupoControleGastos = "12036340XXXXXXXX@g.us";
```

---

### 6. Rode o bot

```bash
node index.js
```

Escaneie o QR Code com seu celular no WhatsApp e pronto! ✅

---

## 📥 Como enviar mensagens no grupo

### ✅ Formato para registrar gastos:

```
Produto - Valor - Cartão - Parcelas
```

**Exemplo:**

```
Pizza - 35.90 - Nubank - Julho de 2026
```

> O valor será registrado automaticamente na planilha.

---

## 📊 Comando de total:

```
total página1
```

> Retorna o total da aba atual (como "Página1" ou "junho", etc.)

---

## 🧾 OCR por imagem

Envie uma **foto de uma fatura** ou nota fiscal e o bot tentará extrair os valores automaticamente.

---

## 🔐 Segurança

- O QR Code é salvo no diretório `auth_info/`
- Somente quem está no grupo especificado pode interagir com o bot
- Mensagens que não seguem o formato esperado são ignoradas

---

## 👨‍🔧 Autor

Criado por [Jean Dias](https://github.com/JEAND1AS?tab=stars)

---

## 📄 Licença

MIT
