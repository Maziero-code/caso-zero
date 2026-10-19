# Caso Zero — Simulador de Investigação Digital 🔍

O **Caso Zero** é um jogo interativo via navegador (web-based) focado em **Forense Digital (DFIR)** e Resposta a Incidentes. O objetivo é analisar artefatos digitais simulados (logs, e-mails, históricos de USB) para solucionar um vazamento de dados corporativo.

Este projeto foi desenvolvido como forma de transformar conceitos técnicos de análise forense em uma experiência interativa de aprendizado, sem acessar dispositivos ou dados reais.

## 🎮 Jogue Agora
Você pode jogar o simulador diretamente no seu navegador através do link abaixo (sem precisar instalar nada):
👉 **[JOGAR CASO ZERO]([https://SEU-USUARIO.github.io/caso-zero/](https://github.com/Maziero-code/caso-zero)**

## ✨ Funcionalidades
- **Interface de Terminal:** Estética hacker/cyberpunk com animações de digitação e sons sintetizados.
- **Cofre de Evidências:** Análise de logs de autenticação, VPN, USB, e-mails e posts de fóruns.
- **Conversor de Fuso Horário:** Ferramenta integrada para cruzar logs em UTC com horários locais (pegadinha fundamental para resolver o caso).
- **Calibração de Confiança:** O jogador avalia sua confiança na resposta. Excesso de confiança no erro resulta em penalidade de pontos.
- **Relatório para LinkedIn:** Ao final, o jogo gera e baixa uma imagem PNG com o seu rank e pontuação para compartilhar.
- **Cronômetro:** Pressão de tempo para simular um incidente real de resposta a ataques.

## 🛠️ Tecnologias Utilizadas
- **HTML5 & CSS3:** Layout responsivo, tema dark/cyberpunk, animações em CSS.
- **Vanilla JavaScript (ES6+):** Lógica de estado do jogo, manipulação do DOM e motor de pontuação (arquitetura limpa com separação de responsabilidades).
- **Web Audio API:** Efeitos sonoros sintetizados (boot do sistema, cliques, alertas de erro e acerto) sem uso de arquivos MP3 externos.
- **HTML2Canvas:** Geração dinâmica de imagem do relatório final de pontuação.
- **JSON:** Toda a história, evidências, suspeitos e lógica de pontuação estão armazenados de forma orientada a dados. O motor do jogo lê o JSON, permitindo criar novos casos sem alterar o código-fonte.

## 🚀 Como rodar o projeto localmente
Como o projeto consome um arquivo `.json` via `fetch`, ele precisa ser rodado em um servidor local. Se você tentar abrir o `index.html` direto no navegador (via `file://`), o navegador bloqueará a leitura do JSON por questões de CORS.

1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU-USUARIO/caso-zero.git
