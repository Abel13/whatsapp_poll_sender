# 🤖 WhatsApp Automate Bot (via Docker)

Este projeto é um bot do WhatsApp construído com [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js), que envia enquetes automaticamente em um grupo e responde a comandos como `!test`. Ele é executado 100% dentro de um container Docker com suporte a persistência de sessão.

---

## 🚀 Funcionalidades

- Login via QR Code (uma vez)
- Envio automático de enquetes diárias via agendamento (cron)
- Comando `!test` para disparo manual
- Persistência da sessão com Docker volumes
- Fácil de rodar localmente ou em servidores

---

## 📦 Requisitos

- Docker
- Docker Compose
- WhatsApp instalado no celular

---

## 📁 Estrutura

```
WhatsAppAutomate/
│
├── bot.js
├── config.json
├── dockerfile
├── docker-compose.yml
├── package.json
└── sessions/            ← persistência da autenticação
```

---

## ⚙️ Passo a passo

### 1. Clone este repositório

```bash
git clone https://github.com/seu-usuario/WhatsAppAutomate.git
cd WhatsAppAutomate
```

### 2. Configure o `config.json`

```json
{
  "pollTime": "10:00",
  "timezone": "America/Sao_Paulo",
  "groupName": "Nome do Grupo Aqui"
}
```

### 3. Execute com Docker

```bash
docker-compose up --build
```

Será exibido um QR Code no terminal. Escaneie com seu WhatsApp.

### 4. Reiniciar depois (sem novo QR Code)

```bash
docker-compose restart
```

---

## 💬 Comandos no WhatsApp

- `!test`: envia manualmente uma enquete no grupo configurado.

---

## 📌 Notas

- A pasta `sessions/` armazena o login. **Não delete**.
- Se quiser trocar de servidor e manter login, copie a pasta `sessions/`.
- Para redefinir a sessão, basta apagar a pasta e reiniciar o container.

---

## 📄 Licença

MIT © 2024