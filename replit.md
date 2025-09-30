# WhatsApp Poll Bot

## Overview
A WhatsApp bot that automatically sends daily polls to a specified group. The poll title is the current date in DD-MM format, with two options: "Sim" and "Não".

## Project Status
- ✅ Bot successfully running and authenticated
- ✅ Daily poll scheduling implemented
- ✅ System dependencies (Chromium) configured

## Configuration
Edit `config.json` to customize:
- `groupName`: The exact name of your WhatsApp group
- `pollTime`: Daily poll time in HH:MM format (24-hour)
- `timezone`: Timezone for scheduling (default: America/Sao_Paulo)

## How to Use
1. Run the bot (workflow starts automatically)
2. Scan the QR code displayed in the console with WhatsApp
3. The bot will authenticate and start monitoring
4. Polls are sent automatically at the configured time
5. If the group name is not found, the bot will list available groups in the console

## Technical Stack
- Node.js with whatsapp-web.js
- node-cron for scheduling
- System Chromium (Nix-managed)
- qrcode-terminal for authentication

## System Dependencies
Chromium and related libraries installed via Nix package manager.

## Last Updated
September 30, 2025
