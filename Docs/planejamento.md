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
| **AT-01** | Modelagem relacional e criação das tabelas no MySQL | Banco de Dados | Alta | Desenvolvedor | Concluído[cite: 5] |
| **AT-02** | Estruturação da API REST com Express e rotas CRUD | Backend | Alta | Desenvolvedor | Concluído[cite: 5] |
| **AT-03** | Configuração da navegação via Expo Router | Frontend Mobile | Alta | Desenvolvedor | Concluído[cite: 5] |
| **AT-04** | Tela de Login e roteamento automático por perfil | Autenticação | Alta | Desenvolvedor | Concluído[cite: 5] |
| **AT-05** | Validação prévia de duplicidade de CPF e E-mail | Backend / Auth | Alta | Desenvolvedor | Concluído[cite: 5] |
| **AT-06** | Tela de Agendamento com seleção em cascata | Paciente | Alta | Desenvolvedor | Concluído[cite: 5] |
| **AT-07** | Criação dinâmica de slots de 30 min no Node.js | Backend | Alta | Desenvolvedor | Concluído[cite: 5] |
| **AT-08** | Sistema de Fila de Espera com subquery de posição | Paciente / API | Alta | Desenvolvedor | Concluído[cite: 5] |
| **AT-09** | Motor de promoção automática na fila ao cancelar | Backend | Alta | Desenvolvedor | Concluído[cite: 5] |
| **AT-10** | Trava de segurança para cancelamentos (< 24 horas) | Paciente / Regra | Média | Desenvolvedor | Concluído[cite: 5] |
| **AT-11** | Painel do Médico: visualização de agenda diária/semanal | Médico | Alta | Desenvolvedor | Concluído[cite: 5] |
| **AT-12** | Criação de novos turnos de atendimento médico | Médico | Média | Desenvolvedor | Concluído[cite: 5] |
| **AT-13** | Marcação de presenças/faltas e conclusão de consultas | Médico | Média | Desenvolvedor | Concluído[cite: 5] |
| **AT-14** | Alinhamento da grade do calendário (colunas de 14.28%) | UI / Layout | Média | Desenvolvedor | Concluído[cite: 5] |
| **AT-15** | Gráfico de produtividade anual de atendimentos | Médico | Baixa | Desenvolvedor | Concluído[cite: 5] |
| **AT-16** | Painel do Administrador e gerenciamento de acessos | Administrador | Alta | Desenvolvedor | Concluído[cite: 5] |
| **AT-17** | Edição administrativa de usuários (Nascimento, Sexo, CRM) | Administrador | Média | Desenvolvedor | Concluído[cite: 5] |
| **AT-18** | Central de Notificações com persistência em AsyncStorage | Paciente / Médico | Média | Desenvolvedor | Concluído[cite: 5] |
| **AT-19** | Testes de integração, documentação e estruturação README | Geral | Alta | Desenvolvedor | Concluído[cite: 5] |

---

## 3. Mapeamento das Entregas

* **Etapa 1 — Proposta e Protótipo:** Definição da área (Saúde), escopo do problema (ociosidade em clínicas), público-alvo e prototipagem inicial[cite: 5].
* **Etapa 2 — Requisitos e Modelagem:** Mapeamento de Requisitos Funcionais e Não Funcionais, matriz de regras de negócio e modelagem do banco relacional MySQL[cite: 5].
* **Etapa 3 — Arquitetura e Navegação:** Separação da arquitetura Monorepo (`backend_clini` e `cliniflow_app`), configuração de rotas protegidas no Expo Router e endpoints base[cite: 5].
* **Etapa 4 — Desenvolvimento Funcional:** Implementação dos fluxos de agendamento, formulários com máscaras dinâmicas, tratamento de erros e validações de integridade[cite: 5].
* **Etapa 5 — Conclusão e Entrega Final:** Automação completa da fila de espera, alinhamento dos calendários visuais, documentação completa e testes finais de ponta a ponta[cite: 5].

---

## 4. Dificuldades Encontradas e Soluções Aplicadas

* **Alinhamento da Grade do Calendário:** 
  * *Problema:* O uso de `justifyContent: 'space-around'` desalinhava os dias do mês quando a primeira semana continha poucos dias.
  * *Solução:* Implementação de blocos com largura fixa de `14.28%` combinados com cálculo dinâmico de células vazias baseadas no `getDay()` do primeiro dia do mês.
* **Transição Atômica da Fila de Espera:** 
  * *Problema:* O cancelamento de consultas apenas alterava o status para `'Cancelada'`, deixando os pacientes da lista de espera sem atendimento.
  * *Solução:* Criação de um pipeline transacional no endpoint `PATCH /consulta/:id/cancelar` que localiza o primeiro paciente da fila, cria uma nova consulta com o mesmo turno, desativa o registro da fila e migra os demais excedentes para a nova consulta.
* **Validação de Unicidade sem Quebra de Execução:** 
  * *Problema:* Confiar apenas no erro `ER_DUP_ENTRY` do MySQL gerava mensagens de erro genéricas no aplicativo.
  * *Solução:* Adição de uma verificação prévia (`SELECT`) no Node.js que identifica especificamente se o conflito ocorreu no E-mail ou no CPF, retornando respostas amigáveis.
