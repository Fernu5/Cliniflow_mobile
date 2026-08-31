# Planejamento de Desenvolvimento — CliniFlow

## 1. Metodologia Adotada
O desenvolvimento do CliniFlow utilizou a metodologia ágil **Kanban** combinada com **Desenvolvimento Iterativo e Incremental**. 
O fluxo foi estruturado em entregas verticais (Banco de Dados ➔ API REST ➔ Interface Mobile), validando cada funcionalidade de ponta a ponta antes de avançar para a próxima etapa.

### Colunas do Fluxo de Trabalho:
1. **Backlog:** Levantamento de necessidades da clínica, médicos e pacientes.
2. **A Fazer (To Do):** Requisitos selecionados para o ciclo de desenvolvimento atual.
3. **Em Andamento (In Progress):** Construção simultânea de rotas, queries e componentes de interface.
4. **Testes & Integração:** Validação de regras de negócio, alinhamento de layout e comunicação HTTP.
5. **Concluído (Done):** Funcionalidade homologada e integrada ao monorepo.

---

## 2. Quadro de Acompanhamento das Atividades

| ID | Atividade / Tarefa | Módulo | Prioridade | Responsável | Situação |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AT-01** | Modelagem relacional e criação das tabelas no MySQL | Banco de Dados | Alta | Desenvolvedor | Concluído] |
| **AT-02** | Estruturação da API REST com Express e rotas CRUD | Backend | Alta | Desenvolvedor | Concluído |
| **AT-03** | Configuração da navegação via Expo Router | Frontend Mobile | Alta | Desenvolvedor | Concluído |
| **AT-04** | Tela de Login e roteamento automático por perfil | Autenticação | Alta | Desenvolvedor | Concluído |
| **AT-05** | Validação prévia de duplicidade de CPF e E-mail | Backend / Auth | Alta | Desenvolvedor | Concluído |
| **AT-06** | Tela de Agendamento com seleção em cascata | Paciente | Alta | Desenvolvedor | Concluído |
| **AT-07** | Criação dinâmica de slots de 30 min no Node.js | Backend | Alta | Desenvolvedor | Concluído |
| **AT-08** | Sistema de Fila de Espera com subquery de posição | Paciente / API | Alta | Desenvolvedor | Concluído |
| **AT-09** | Motor de promoção automática na fila ao cancelar | Backend | Alta | Desenvolvedor | Concluído |
| **AT-10** | Trava de segurança para cancelamentos (< 24 horas) | Paciente / Regra | Média | Desenvolvedor | Concluído |
| **AT-11** | Painel do Médico: visualização de agenda diária/semanal | Médico | Alta | Desenvolvedor | Concluído |
| **AT-12** | Criação de novos turnos de atendimento médico | Médico | Média | Desenvolvedor | Concluído |
| **AT-13** | Marcação de presenças/faltas e conclusão de consultas | Médico | Média | Desenvolvedor | Concluído |
| **AT-14** | Alinhamento da grade do calendário (colunas de 14.28%) | UI / Layout | Média | Desenvolvedor | Concluído |
| **AT-15** | Gráfico de produtividade anual de atendimentos | Médico | Baixa | Desenvolvedor | Concluído |
| **AT-16** | Painel do Administrador e gerenciamento de acessos | Administrador | Alta | Desenvolvedor | Concluído |
| **AT-17** | Edição administrativa de usuários (Nascimento, Sexo, CRM) | Administrador | Média | Desenvolvedor | Concluído |
| **AT-18** | Central de Notificações com persistência em AsyncStorage | Paciente / Médico | Média | Desenvolvedor | Concluído |
| **AT-19** | Testes de integração, documentação e estruturação README | Geral | Alta | Desenvolvedor | Concluído |

---

## 3. Mapeamento das Entregas

* **Etapa 1 — Proposta e Protótipo:** Definição da área (Saúde), escopo do problema (ociosidade em clínicas), público-alvo e prototipagem inicial.
* **Etapa 2 — Requisitos e Modelagem:** Mapeamento de Requisitos Funcionais e Não Funcionais, matriz de regras de negócio e modelagem do banco relacional MySQL.
* **Etapa 3 — Arquitetura e Navegação:** Separação da arquitetura Monorepo (`backend_clini` e `teste_clini`), configuração de rotas protegidas no Expo Router e endpoints base.
* **Etapa 4 — Desenvolvimento Funcional:** Implementação dos fluxos de agendamento, formulários com máscaras dinâmicas, tratamento de erros e validações de integridade.
* **Etapa 5 — Conclusão e Entrega Final:** Automação completa da fila de espera, alinhamento dos calendários visuais, documentação completa e testes finais de ponta a ponta.
