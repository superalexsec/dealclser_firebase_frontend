# ZapCentral - Plataforma de Integração WhatsApp Business

![ZapCentral Logo](./public/zap_central.png)

ZapCentral é uma plataforma multi-tenant para gerenciamento de interações via WhatsApp Business, integrando calendário, contratos e pagamentos em um único lugar.

## 🚀 Funcionalidades

- 📱 Integração com WhatsApp Business API
- 📅 Agendamento automático via Google Calendar
- 📄 Geração e assinatura de contratos
- 💳 Integração com MercadoPago
- 👥 Sistema multi-tenant
- 📊 Dashboard com análise de dados
- 🔄 Fluxos de mensagens personalizáveis
- 🏢 Gestão de múltiplos clientes

## 🛠 Tecnologias

- React 18
- TypeScript
- Material-UI
- React Query
- React Router
- Google Cloud Platform
  - Cloud Run
  - Cloud SQL (PostgreSQL)
  - Secret Manager

## 📦 Instalação

```bash
# Clone o repositório
git clone https://github.com/superalexsec/zapcentral-frontend.git

# Entre no diretório
cd zapcentral-frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm start
```

## 🔧 Configuração

1. Crie um arquivo `.env` baseado no `.env.example`
2. Configure as variáveis de ambiente necessárias
3. Configure as credenciais do WhatsApp Business API
4. Configure as integrações (Google Calendar, MercadoPago, etc.)

## 🌐 Ambiente de Produção

```bash
# Build do projeto
npm run build

# Deploy para o Google Cloud Run
gcloud builds submit --config cloudbuild.yaml
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🤝 Contribuição

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Faça o Commit das suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Faça o Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📫 Contato

- Website: [zapcentral.com.br](https://zapcentral.com.br)
- Email: [contato@zapcentral.com.br](mailto:contato@zapcentral.com.br)

## 🙏 Agradecimentos

- WhatsApp Business API
- Google Cloud Platform
- MercadoPago
- Dropbox Sign 