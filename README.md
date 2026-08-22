# Cliniflow_mobile
Versão Mobile do Cliniflow

O **Cliniflow_mobile** é um aplicativo mobile desenvolvido em React Native para otimizar o agendamento de consultas médicas.

## Principais Funcionalidades

*   **Autenticação e Perfis:** Login e Cadastro e roteamento inteligente (Dashboards/Home específicos para Pacientes, Médicos e Administradores).
*   **Gestão de Consultas:** Agendamento de horários disponíveis integrados diretamente com a agenda do médico.
*   **Fila de Espera:** Reserva de posição na fila em tempo real caso o horário desejado esteja ocupado.
*   **Notificações Dinâmicas:** Alertas informando sobre cancelamentos, confirmações de consultas e avisos do sistema.
*   **Dashboard Administrativo:** Visão geral da clínica, encerramento de filas, gerenciamento de usuários e controle de acessos.
*   **Painel do Médico:** Visualização de agenda, marcação de presenças/faltas, conclusão de consultas e gráficos estatísticos anuais.

## Tecnologias Utilizadas

**Frontend (Mobile):**
*   **React Native (Expo):** Para construção da interface.
*   **Expo Router:** Gerenciamento de rotas e navegação baseada em arquivos.
*   **AsyncStorage:** Armazenamento local no dispositivo para controle das notificações lidas.
*   **Node.js:** Criação da API para o backend e dados.
*   **MySQL:** Banco de dados relacional para persistência de dados (Consultas, Usuários, Perfis, Agendas).

## Instruções de Instalação e Execução

### Pré-requisitos
*   Node.js instalado na máquina.
*   Servidor MySQL rodando localmente (ex: Workbench, XAMPP, WAMP).
*   App **Expo Go** instalado no smartphone.

### Configurando o Banco de Dados (Backend)
1. Inicie o seu servidor MySQL.
2. Crie um banco de dados chamado `clinica`.
3. Importe o script SQL (disponibilizado no repositório) para gerar as tabelas.
4. No arquivo `server.js`, certifique-se de que as credenciais do banco estão corretas (usuário, senha).
5. Abra o terminal na pasta do backend e instale as dependências:
   npm install
6. Inicie o servidor:
   npm run dev

### Executando o Aplicativo
1. No arquivo das telas do aplicativo (ex: home.tsx, agendamento.tsx, etc), altere a constante IP para o endereço IPv4 local da sua máquina.
2. Abra o terminal na pasta do aplicativo (React Native) e instale as dependências:
   npm install
3. Inicie o Expo:
   npx expo start
4. Escaneie o QR Code gerado no terminal com o aplicativo Expo Go no seu celular

### Imagens das principais Telas
1. Tela da dashboard/Home do Administrador
<img width="429" height="806" alt="image" src="https://github.com/user-attachments/assets/34021719-3d16-423f-b4cf-9cc5e24be84e" />

2. Tela da Home do Paciente
<img width="422" height="813" alt="image" src="https://github.com/user-attachments/assets/e684c633-3c18-4a16-af22-cdca716b96c3" />

3. Tela da dashboard/Home do Medico
<img width="282" height="808" alt="image" src="https://github.com/user-attachments/assets/ee31abcd-fdf7-407d-8ac9-72a71ecb2f01" />

5. Agendamento de uma consulta
<img width="317" height="840" alt="image" src="https://github.com/user-attachments/assets/e5fc3efd-1443-4f37-9ad1-7da83473f34f" />

### Limitações e Melhorias Futuras
Limitações Atuais:
Ausência de recuperação de senha real.

A API faz o login apenas com conferência de dados em texto simples.

Melhorias Futuras:

Implementar Push Notifications nativas utilizando serviços como o Firebase Cloud Messaging.

Criptografar as senhas no banco de dados.
