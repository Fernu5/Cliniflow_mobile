# 📑 Especificação de Requisitos — CliniFlow

## 1. Visão Geral do Sistema
O **CliniFlow** é uma plataforma integrada de gestão clínica voltada para otimizar o fluxo de agendamentos, reduzir a ociosidade de profissionais de saúde e gerenciar dinamicamente listas de espera através de uma aplicação mobile conectada a uma API REST e banco relacional.

---

## 2. Requisitos Funcionais (RF)

| Código | Descrição do Requisito | Módulo |
| :--- | :--- | :--- |
| **RF01** | O sistema deve permitir o cadastro de novos usuários com nome, sobrenome, e-mail, senha, CPF, data de nascimento e sexo. | Autenticação |
| **RF02** | O sistema deve validar a unicidade de CPF e E-mail no momento do cadastro, bloqueando duplicidades. | Autenticação |
| **RF03** | O sistema deve autenticar usuários e redirecioná-los automaticamente para o painel correspondente (Paciente, Médico ou Administrador). | Autenticação |
| **RF04** | O sistema deve permitir a seleção de consultas em cascata: Especialidade ➔ Médico ➔ Data ➔ Horário. | Paciente |
| **RF05** | O sistema deve gerar slots de atendimento de 30 minutos baseados nos turnos do médico cadastrados pelo administrador. | Backend |
| **RF06** | O sistema deve permitir que o paciente entre na Lista de Espera caso o horário desejado já esteja ocupado. | Paciente |
| **RF07** | O sistema deve calcular em tempo real a posição numérica (`#1`, `#2`...) do paciente dentro da fila de espera. | Paciente / API |
| **RF08** | O sistema deve promover automaticamente o primeiro paciente da lista de espera para o status `Agendada` quando uma consulta for cancelada. | Backend |
| **RF09** | O sistema deve bloquear cancelamentos de consultas agendadas realizados com menos de 24 horas de antecedência. | Paciente |
| **RF10** | O médico deve conseguir visualizar sua agenda diária e semanal com indicação visual de horários livres e ocupados. | Médico |
| **RF11** | O médico deve conseguir alterar o status de suas consultas para `Concluída` ou `Faltou`. | Médico |
| **RF12** | O sistema deve exibir para o médico um histórico anual gráfico com o volume mensal de atendimentos realizados. | Médico |
| **RF13** | O administrador deve visualizar indicadores globais da clínica (total de pacientes, médicos, consultas do dia e filas ativas). | Administrador |
| **RF14** | O administrador deve conseguir criar novos turnos de atendimento definindo data, hora inicial e hora final. | Administrador |
| **RF15** | O administrador deve conseguir editar dados cadastrais de usuários (Nome, Sobrenome, E-mail, CPF, CRM, Nascimento e Sexo). | Administrador |
| **RF16** | O administrador deve conseguir inativar ou reativar contas de usuários. | Administrador |
| **RF17** | O administrador deve conseguir encerrar listas de espera completas ou remover pacientes individuais. | Administrador |
| **RF18** | O sistema deve fornecer uma central de notificações dinâmicas para pacientes e médicos com contador de não lidas. | Notificações |

---

## 3. Requisitos Não Funcionais (RNF)

| Código | Descrição do Requisito | Categoria |
| :--- | :--- | :--- |
| **RNF01** | O frontend mobile deve ser desenvolvido em **React Native** com **TypeScript** e **Expo Router**. | Arquitetura |
| **RNF02** | O backend deve ser estruturado em **Node.js** com **Express**, seguindo o padrão de API RESTful. | Arquitetura |
| **RNF03** | A persistência de dados transacionais deve utilizar o banco de dados relacional **MySQL**. | Banco de Dados |
| **RNF04** | A persistência local de estados leves (leitura de notificações) deve utilizar **AsyncStorage** no dispositivo. | Armazenamento |
| **RNF05** | A comunicação entre cliente e servidor deve adotar estritamente a semântica de verbos HTTP (`GET`, `POST`, `PUT`, `PATCH`). | Protocolo |
| **RNF06** | A interface gráfica deve ser construída com alinhamento matemático (colunas proporcionais de `14.28%`) para manter a fidelidade em diferentes resoluções de tela. | Usabilidade |
| **RNF07** | O aplicativo deve apresentar indicadores visuais de carregamento (`ActivityIndicator`) e alertas informativos em todas as operações assíncronas. | Usabilidade |
| **RNF08** | O repositório deve estar organizado no formato Monorepo, contendo `.gitignore` configurado e scripts de banco de dados. | Manutenibilidade |

---

## 4. Regras de Negócio (RN)

* **RN01 — Unicidade Cadastral:** Não é permitido o cadastro de dois usuários com o mesmo CPF ou endereço de E-mail.
* **RN02 — Janela Mínima de Cancelamento:** O cancelamento autônomo por parte do paciente exige antecedência mínima de 24 horas em relação ao horário de início da consulta.
* **RN03 — Prevenção de Auto-Enfileiramento:** Um paciente não pode ingressar na lista de espera de um horário em que ele próprio já é o titular da consulta agendada.
* **RN04 — Prioridade na Fila de Espera (FIFO):** A promoção de pacientes da lista de espera para consultas segue rigorosamente a ordem cronológica de entrada.
* **RN05 — Controle de Acesso:** Usuários marcados com status `Desativado` são impedidos de realizar login no sistema.
* **RN06 — Conflito de Agendas:** Médicos não podem ter dois turnos cadastrados para o mesmo intervalo de horário na mesma data.
