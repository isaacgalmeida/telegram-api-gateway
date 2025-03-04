Segue abaixo um exemplo de README.md para o projeto:

---

# TeleBridge API

Uma API REST que atua como gateway para o Telegram. Com ela, você pode enviar, editar e recuperar mensagens de um canal específico, além de obter a _string_session_ necessária para autenticação. Essa API utiliza o [TelegramClient](https://github.com/gram-js/gramjs) (baseado no gramJS) e o [Express](https://expressjs.com/) para expor endpoints HTTP seguros.

## Funcionalidades

- **Autenticação Interativa:** Realiza o fluxo de login com o Telegram, solicitando número de telefone, código e senha (se aplicável) e gerando uma _string_session_.
- **Endpoints Protegidos:** Todos os endpoints (exceto `/health`) exigem um token de autenticação para garantir segurança.
- **Envio de Mensagens:** Envia mensagens para um canal alvo.
- **Edição de Mensagens:** Edita mensagens já enviadas.
- **Recuperação de Mensagens:** Busca as 10 mensagens mais recentes do canal alvo.
- **Recuperação da String Session:** Retorna a _string_session_ atual para que você possa usá-la no `.env`.

## Pré-requisitos

- **Node.js:** Recomendado a versão 16 ou superior.
- **Docker & Docker Compose:** Caso deseje executar a API em um container e disponibilizar os endpoints para outros serviços.
- **Credenciais do Telegram:** Você precisará de uma API ID e API Hash.  
  **IMPORTANTE:** Obtenha suas credenciais acessando [https://my.telegram.org](https://my.telegram.org) e criando uma nova aplicação.

## Configuração

1. **Clone o repositório:**

   ```bash
   git clone https://github.com/seuusuario/telebridge-api.git
   cd telebridge-api
   ```

2. **Crie o arquivo `.env` na raiz do projeto com as seguintes variáveis:**

   ```env
   # Variáveis do Telegram (obtenha sua API ID e API Hash em https://my.telegram.org)
   TELEGRAM_API_ID=YOUR_TELEGRAM_API_ID
   TELEGRAM_API_HASH=YOUR_TELEGRAM_API_HASH
   STRING_SESSION=   # Deixe vazio para gerar uma nova sessão interativa
   CHANNELS_SOURCE=feedgenerator.xyz,feedgenerator.xyz:3000,feedgenerator.tech
   CHANNEL_TARGET=SeuCanalAlvo  # Nome do canal alvo (sem @)

   # Token de autenticação para proteger os endpoints da API
   AUTH_TOKEN=your_secret_token_here

   # Porta em que o servidor Express irá rodar
   PORT=3002
   ```

   **Observação:**  
   - Substitua `YOUR_TELEGRAM_API_ID` e `YOUR_TELEGRAM_API_HASH` pelas credenciais que você gerou em [https://my.telegram.org](https://my.telegram.org).  
   - Defina `CHANNELS_SOURCE` e `CHANNEL_TARGET` conforme sua necessidade.  
   - Defina um token seguro para `AUTH_TOKEN`.

3. **Instale as dependências:**

   ```bash
   npm install
   ```

## Executando a API

### Execução Local

Para executar localmente, basta rodar:

```bash
node server.js
```

O script entrará no fluxo interativo de autenticação. Insira seu número, código (recebido no Telegram) e senha (se necessário). Se o código expirar, o sistema aguardará 3 segundos e solicitará um novo código, mantendo a mesma sessão.

Após uma autenticação bem-sucedida, a _string_session_ será exibida no console e estará disponível via o endpoint `/session`.

### Testando os Endpoints com cURL

**Obter a String Session:**

```bash
curl -X GET http://localhost:3002/session \
     -H "Authorization: Bearer your_secret_token_here"
```

**Enviar Mensagem:**

```bash
curl -X POST http://localhost:3002/send-message \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_secret_token_here" \
     -d '{"message": "Olá, este é um teste do bot!"}'
```

**Editar Mensagem:**

```bash
curl -X PUT http://localhost:3002/edit-message \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_secret_token_here" \
     -d '{"messageId": 1234, "newText": "Texto editado com sucesso!"}'
```

**Recuperar Mensagens:**

```bash
curl -X GET http://localhost:3002/get-messages \
     -H "Authorization: Bearer your_secret_token_here"
```

**Health Check:**

```bash
curl -X GET http://localhost:3002/health
```

### Executando com Docker

1. **Construa a imagem e inicie o container usando o Docker Compose:**

   ```bash
   docker-compose up -d --build
   ```

2. **A API ficará disponível na porta definida no arquivo `.env` (por padrão, 3002).**

## Segurança

- **Autenticação:** Todos os endpoints (exceto `/health`) requerem o header `Authorization: Bearer <AUTH_TOKEN>`.
- **Ambiente:** Não compartilhe suas credenciais do Telegram nem a _string_session_ publicamente.

## Contribuição

Pull requests são bem-vindos! Para grandes mudanças, por favor abra uma _issue_ primeiro para discutir o que você gostaria de alterar.

## Licença

Este projeto é licenciado sob a [MIT License](LICENSE).

---

