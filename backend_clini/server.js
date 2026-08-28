const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'clinica'
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar no banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL com sucesso!');
});

//-----------ROTAS GERAIS ADMIN E PACIENTE----------

app.get('/usuarios', (req, res) => {
  const sql = `
    SELECT 
      u.id_usuario AS id, 
      CONCAT(u.nome_usuario, ' ', u.sobrenome_usuario) AS nome, 
      u.email_usuario AS email, 
      u.status_usuario AS status, 
      p.tipo_perfil AS tipo 
    FROM usuarios u 
    LEFT JOIN perfis p ON u.id_usuario = p.usuario
    WHERE u.adm_usuario = 0
  `;
  
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro ao buscar usuários' });
    res.json(results);
  });
});

app.get('/consultas', (req, res) => { 
  const sql = `
    SELECT 
      c.id_consulta AS id, 
      CONCAT(up.nome_usuario, ' ', up.sobrenome_usuario) AS paciente, 
      CONCAT('Dr. ', um.nome_usuario, ' ', um.sobrenome_usuario) AS medico, 
      e.tipo_especialidade AS especialidade,
      DATE_FORMAT(c.data_hora_consulta_inicio, '%d/%m') AS data,
      DATE_FORMAT(c.data_hora_consulta_inicio, '%H:%i') AS hora, 
      c.status_consulta AS status_db 
    FROM consultas c 
    JOIN perfis pp ON c.paciente = pp.id_perfil 
    JOIN usuarios up ON pp.usuario = up.id_usuario 
    JOIN perfis pm ON c.medico = pm.id_perfil 
    JOIN usuarios um ON pm.usuario = um.id_usuario 
    LEFT JOIN especialidades_medico em ON pm.id_perfil = em.medico 
    LEFT JOIN especialidades e ON em.especialidade = e.id_especialidade 
    ORDER BY c.data_hora_consulta_inicio DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    
    const consultasFormatadas = results.map(consulta => {
      let statusApp = 'Pendente';
      
      if (consulta.status_db === 'Concluida') statusApp = 'Realizada';
      if (consulta.status_db === 'Cancelada') statusApp = 'Cancelada';
      if (consulta.status_db === 'Faltou') statusApp = 'Cancelada'; 
      
      return { ...consulta, status: statusApp };
    });
    
    res.json(consultasFormatadas);
  });
});

app.get('/listas-espera', (req, res) => {
  const sql = `SELECT c.id_consulta AS id, CONCAT('Dr. ', um.nome_usuario, ' ', um.sobrenome_usuario) AS medico, e.nome_especialidade AS especialidade, DATE_FORMAT(c.data_hora_consulta_inicio, '%d/%m') AS data, DATE_FORMAT(c.data_hora_consulta_inicio, '%H:%i') AS hora, COUNT(le.id_lista_espera) AS pacientes FROM listas_espera le JOIN consultas c ON le.consulta = c.id_consulta JOIN perfis pm ON c.medico = pm.id_perfil JOIN usuarios um ON pm.usuario = um.id_usuario LEFT JOIN especialidades_medico em ON pm.id_perfil = em.medico LEFT JOIN especialidades e ON em.especialidade = e.id_especialidade WHERE le.status_lista_espera = 'Ativa' GROUP BY c.id_consulta, medico, especialidade, data, hora`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json(results);
  });
});

app.get('/fila/:id', (req, res) => {
  const idConsulta = req.params.id;
  const sqlFila = `SELECT c.id_consulta AS id, CONCAT('Dr. ', um.nome_usuario, ' ', um.sobrenome_usuario) AS medico, e.nome_especialidade AS especialidade, DATE_FORMAT(c.data_hora_consulta_inicio, '%d/%m/%Y') AS data, DATE_FORMAT(c.data_hora_consulta_inicio, '%H:%i') AS hora FROM consultas c JOIN perfis pm ON c.medico = pm.id_perfil JOIN usuarios um ON pm.usuario = um.id_usuario LEFT JOIN especialidades_medico em ON pm.id_perfil = em.medico LEFT JOIN especialidades e ON em.especialidade = e.id_especialidade WHERE c.id_consulta = ?`;
  const sqlPacientes = `SELECT le.id_lista_espera AS id, CONCAT(up.nome_usuario, ' ', up.sobrenome_usuario) AS nome, up.email_usuario AS email, 'Sem horário registrado' AS entrada FROM listas_espera le JOIN perfis pp ON le.paciente = pp.id_perfil JOIN usuarios up ON pp.usuario = up.id_usuario WHERE le.consulta = ? AND le.status_lista_espera = 'Ativa' ORDER BY le.posicao_lista_espera ASC, le.id_lista_espera ASC`;
  db.query(sqlFila, [idConsulta], (err, resultFila) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    db.query(sqlPacientes, [idConsulta], (err, resultPacientes) => {
      if (err) return res.status(500).json({ erro: 'Erro' });
      res.json({ info: resultFila[0], pacientes: resultPacientes });
    });
  });
});

app.get('/dashboard-adm', (req, res) => {
  const sql = `SELECT (SELECT COUNT(*) FROM perfis WHERE tipo_perfil = 'Paciente') AS total_pacientes, (SELECT COUNT(*) FROM perfis WHERE tipo_perfil = 'Medico') AS total_medicos, (SELECT COUNT(*) FROM consultas WHERE status_consulta = 'Agendada' AND DATE(data_hora_consulta_inicio) = CURDATE()) AS consultas_pendentes, (SELECT COUNT(*) FROM listas_espera WHERE status_lista_espera = 'Ativa') AS filas_ativas`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json(results[0]);
  });
});

app.get('/usuario/:id', (req, res) => {
  const idUsuario = req.params.id;
  const sql = `SELECT u.id_usuario AS id, u.nome_usuario AS nome, u.sobrenome_usuario AS sobrenome, u.email_usuario AS email, u.cpf_usuario AS cpf, DATE_FORMAT(u.data_nascimento_usuario, '%d/%m/%Y') AS nascimento, u.sexo_usuario AS sexo, u.status_usuario AS status, p.tipo_perfil AS tipo, p.id_perfil, u.crm_usuario AS crm, e.nome_especialidade AS especialidade FROM usuarios u LEFT JOIN perfis p ON u.id_usuario = p.usuario LEFT JOIN especialidades_medico em ON p.id_perfil = em.medico LEFT JOIN especialidades e ON em.especialidade = e.id_especialidade WHERE u.id_usuario = ?`;
  db.query(sql, [idUsuario], (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro interno' });
    if (results.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(results[0]);
  });
});

app.put('/usuario/:id', (req, res) => {
  const idUsuario = req.params.id;
  const { nome, sobrenome, email, cpf, crm, dataNascimento, sexo } = req.body;
  
  const sexoFormatado = sexo === 'M' ? 'Masculino' : 'Feminino';

  const sql = `UPDATE usuarios SET nome_usuario = ?, sobrenome_usuario = ?, email_usuario = ?, cpf_usuario = ?, crm_usuario = ?, data_nascimento_usuario = ?, sexo_usuario = ? WHERE id_usuario = ?`;
  
  db.query(sql, [nome, sobrenome, email, cpf, crm || null, dataNascimento, sexoFormatado, idUsuario], (err, result) => {
    if (err) return res.status(500).json({ erro: 'Erro ao atualizar dados' });
    res.json({ mensagem: 'Atualizado com sucesso!' });
  });
});

app.get('/medico/:idPerfil/especialidade', (req, res) => {
  const idPerfil = req.params.idPerfil;
  const sql = "SELECT especialidade FROM especialidades_medico WHERE medico = ?";
  db.query(sql, [idPerfil], (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json({ id_especialidade: results.length > 0 ? results[0].especialidade : null });
  });
});

app.post('/medico/:idPerfil/especialidade', (req, res) => {
  const idPerfil = req.params.idPerfil;
  const { id_especialidade } = req.body;
  const sqlDelete = "DELETE FROM especialidades_medico WHERE medico = ?";
  const sqlInsert = "INSERT INTO especialidades_medico (medico, especialidade) VALUES (?, ?)";
  db.query(sqlDelete, [idPerfil], (errDel) => {
    if (errDel) return res.status(500).json({ erro: 'Erro' });
    if (id_especialidade) {
      db.query(sqlInsert, [idPerfil, id_especialidade], (errIns) => {
        if (errIns) return res.status(500).json({ erro: 'Erro' });
        res.json({ mensagem: 'Sucesso!' });
      });
    } else {
      res.json({ mensagem: 'Removido.' });
    }
  });
});

app.patch('/usuario/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const sql = 'UPDATE usuarios SET status_usuario = ? WHERE id_usuario = ?';
  db.query(sql, [status, id], (err, result) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json({ mensagem: 'Sucesso' });
  });
});

app.get('/consulta/:id', (req, res) => {
  const idConsulta = req.params.id;
  const sql = `SELECT c.id_consulta AS id, c.status_consulta AS status, DATE_FORMAT(c.data_hora_consulta_inicio, '%d/%m/%Y') AS data, DATE_FORMAT(c.data_hora_consulta_inicio, '%H:%i') AS hora_inicio, DATE_FORMAT(c.data_hora_consulta_fim, '%H:%i') AS hora_fim, CONCAT(up.nome_usuario, ' ', up.sobrenome_usuario) AS paciente_nome, up.cpf_usuario AS paciente_cpf, CONCAT('Dr. ', um.nome_usuario, ' ', um.sobrenome_usuario) AS medico_nome, e.nome_especialidade AS especialidade FROM consultas c JOIN perfis pp ON c.paciente = pp.id_perfil JOIN usuarios up ON pp.usuario = up.id_usuario JOIN perfis pm ON c.medico = pm.id_perfil JOIN usuarios um ON pm.usuario = um.id_usuario LEFT JOIN especialidades_medico em ON pm.id_perfil = em.medico LEFT JOIN especialidades e ON em.especialidade = e.id_especialidade WHERE c.id_consulta = ?`;
  db.query(sql, [idConsulta], (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    if (results.length === 0) return res.status(404).json({ erro: 'Não encontrada' });
    res.json(results[0]);
  });
});

app.patch('/consulta/:id/cancelar', (req, res) => {
  const { id } = req.params;

  const sqlBuscaConsulta = "SELECT medico, data_hora_consulta_inicio, data_hora_consulta_fim FROM consultas WHERE id_consulta = ?";
  
  db.query(sqlBuscaConsulta, [id], (errBusca, resultsBusca) => {
    if (errBusca || resultsBusca.length === 0) return res.status(500).json({ erro: 'Erro ao buscar consulta' });
    
    const consultaOriginal = resultsBusca[0];

    // 2. Cancela a consulta atual do paciente desistente
    const sqlCancela = "UPDATE consultas SET status_consulta = 'Cancelada' WHERE id_consulta = ?";
    
    db.query(sqlCancela, [id], (errCancela) => {
      if (errCancela) return res.status(500).json({ erro: 'Erro ao cancelar' });

      // 3. Verifica se tem alguém na lista de espera para ESTA consulta
      const sqlBuscaFila = "SELECT id_lista_espera, paciente FROM listas_espera WHERE consulta = ? AND status_lista_espera = 'Ativa' ORDER BY id_lista_espera ASC LIMIT 1";
      
      db.query(sqlBuscaFila, [id], (errFila, resultsFila) => {
        if (errFila) return res.status(500).json({ erro: 'Erro ao verificar fila' });

        // Se não tem ninguém na fila, o processo termina aqui normalmente
        if (resultsFila.length === 0) {
          return res.json({ mensagem: 'Cancelada com sucesso.' });
        }

        // 4. Se TEM alguém na fila: Promove o primeiro paciente!
        const pacientePromovido = resultsFila[0];

        // 4.1 Cria uma NOVA consulta para o paciente promovido
        const sqlNovaConsulta = "INSERT INTO consultas (paciente, medico, data_hora_consulta_inicio, data_hora_consulta_fim, status_consulta) VALUES (?, ?, ?, ?, 'Agendada')";
        
        db.query(sqlNovaConsulta, [pacientePromovido.paciente, consultaOriginal.medico, consultaOriginal.data_hora_consulta_inicio, consultaOriginal.data_hora_consulta_fim], (errNova, resultNova) => {
          if (errNova) return res.status(500).json({ erro: 'Erro ao agendar paciente da fila' });

          const idNovaConsulta = resultNova.insertId;

          // 4.2 Remove o paciente promovido da lista de espera (Desativada)
          const sqlTiraDaFila = "UPDATE listas_espera SET status_lista_espera = 'Desativada' WHERE id_lista_espera = ?";
          db.query(sqlTiraDaFila, [pacientePromovido.id_lista_espera], (errTira) => {
            if (errTira) console.error("Erro ao atualizar fila");

            // 4.3 Transfere os pacientes restantes na fila para a NOVA consulta criada
            const sqlTransfereFila = "UPDATE listas_espera SET consulta = ? WHERE consulta = ? AND status_lista_espera = 'Ativa'";
            db.query(sqlTransfereFila, [idNovaConsulta, id], (errTransfere) => {
              if (errTransfere) console.error("Erro ao transferir fila restante");
              
              res.json({ mensagem: 'Cancelada e próximo da fila assumiu a vaga!' });
            });
          });
        });
      });
    });
  });
});

app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  const sql = `SELECT u.id_usuario AS id, u.nome_usuario AS nome, u.senha_usuario AS senha_banco, u.status_usuario AS status, u.adm_usuario AS is_admin, p.tipo_perfil AS perfil FROM usuarios u LEFT JOIN perfis p ON u.id_usuario = p.usuario WHERE u.email_usuario = ?`;
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro interno' });
    if (results.length === 0) return res.status(401).json({ erro: 'Não encontrado' });
    const usuario = results[0];
    if (senha !== usuario.senha_banco) return res.status(401).json({ erro: 'Senha incorreta' });
    if (usuario.status !== 'Ativo') return res.status(403).json({ erro: 'Sua conta está inativa.\nProcure a administração' });
    res.json({ mensagem: 'Sucesso', id: usuario.id, nome: usuario.nome, isAdmin: usuario.is_admin === 1, perfil: usuario.perfil });
  });
});

app.post('/cadastro', (req, res) => {
  const { nome, sobrenome, email, senha, cpf, dataNascimento, sexo, tipoPerfil, crm } = req.body;
  const sexoFormatado = sexo === 'M' ? 'Masculino' : 'Feminino';
  const perfilFinal = tipoPerfil || 'Paciente';
  const valorCrm = perfilFinal === 'Medico' ? crm : null;

  const sqlVerificacao = "SELECT email_usuario, cpf_usuario FROM usuarios WHERE email_usuario = ? OR cpf_usuario = ?";
  
  db.query(sqlVerificacao, [email, cpf], (errVerifica, resultsVerifica) => {
    if (errVerifica) return res.status(500).json({ erro: 'Erro interno ao validar dados' });

    if (resultsVerifica.length > 0) {
      const conflito = resultsVerifica[0];
      if (conflito.email_usuario === email) {
        return res.status(400).json({ erro: 'Este E-mail já está cadastrado no sistema.' });
      } else {
        return res.status(400).json({ erro: 'Este CPF já está cadastrado no sistema.' });
      }
    }

    const sqlUsuario = `INSERT INTO usuarios (nome_usuario, sobrenome_usuario, email_usuario, senha_usuario, cpf_usuario, data_nascimento_usuario, sexo_usuario, crm_usuario, status_usuario, adm_usuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Ativo', 0)`;
    
    db.query(sqlUsuario, [nome, sobrenome, email, senha, cpf, dataNascimento, sexoFormatado, valorCrm], (err, result) => {
      if (err) return res.status(500).json({ erro: 'Erro ao cadastrar usuário' });
      
      const idNovoUsuario = result.insertId;
      const sqlPerfil = "INSERT INTO perfis (usuario, tipo_perfil) VALUES (?, ?)";
      
      db.query(sqlPerfil, [idNovoUsuario, perfilFinal], (err2) => {
        if (err2) return res.status(500).json({ erro: 'Erro ao criar perfil' });
        res.status(201).json({ mensagem: 'Sucesso!' });
      });
    });
  });
});

app.get('/paciente/:id/dashboard', (req, res) => {
  const idUsuario = req.params.id;

  const sqlAtivas = `
    SELECT c.id_consulta AS id, DATE_FORMAT(c.data_hora_consulta_inicio, '%d/%m/%Y') AS data, DATE_FORMAT(c.data_hora_consulta_inicio, '%H:%i') AS hora, CONCAT('Dr. ', um.nome_usuario) AS medico, e.tipo_especialidade AS especialidade, 'Agendada' AS status, c.data_hora_consulta_inicio AS data_ordenacao 
    FROM consultas c 
    JOIN perfis pp ON c.paciente = pp.id_perfil 
    JOIN perfis pm ON c.medico = pm.id_perfil 
    JOIN usuarios um ON pm.usuario = um.id_usuario 
    LEFT JOIN especialidades_medico em ON pm.id_perfil = em.medico 
    LEFT JOIN especialidades e ON em.especialidade = e.id_especialidade 
    WHERE pp.usuario = ? AND c.status_consulta = 'Agendada' 
    UNION ALL 
    SELECT le.id_lista_espera AS id, DATE_FORMAT(c.data_hora_consulta_inicio, '%d/%m/%Y') AS data, DATE_FORMAT(c.data_hora_consulta_inicio, '%H:%i') AS hora, CONCAT('Dr. ', um.nome_usuario) AS medico, e.tipo_especialidade AS especialidade, 'Em espera' AS status, c.data_hora_consulta_inicio AS data_ordenacao 
    FROM listas_espera le 
    JOIN consultas c ON le.consulta = c.id_consulta 
    JOIN perfis pp ON le.paciente = pp.id_perfil 
    JOIN perfis pm ON c.medico = pm.id_perfil 
    JOIN usuarios um ON pm.usuario = um.id_usuario 
    LEFT JOIN especialidades_medico em ON pm.id_perfil = em.medico 
    LEFT JOIN especialidades e ON em.especialidade = e.id_especialidade 
    WHERE pp.usuario = ? AND le.status_lista_espera = 'Ativa' 
    ORDER BY data_ordenacao ASC
  `;

  const sqlHistorico = `
    SELECT 
      c.id_consulta AS id, 
      DATE_FORMAT(c.data_hora_consulta_inicio, '%d/%m/%Y') AS data, 
      DATE_FORMAT(c.data_hora_consulta_inicio, '%H:%i') AS hora, 
      CONCAT('Dr. ', um.nome_usuario) AS medico, 
      e.tipo_especialidade AS especialidade, 
      c.status_consulta AS status_db
    FROM consultas c
    JOIN perfis pp ON c.paciente = pp.id_perfil
    JOIN perfis pm ON c.medico = pm.id_perfil
    JOIN usuarios um ON pm.usuario = um.id_usuario
    LEFT JOIN especialidades_medico em ON pm.id_perfil = em.medico
    LEFT JOIN especialidades e ON em.especialidade = e.id_especialidade
    WHERE pp.usuario = ? AND c.status_consulta IN ('Concluida', 'Cancelada', 'Faltou')
    ORDER BY c.data_hora_consulta_inicio DESC
  `;

  db.query(sqlAtivas, [idUsuario, idUsuario], (err, resultsAtivas) => {
    if (err) return res.status(500).json({ erro: 'Erro nas ativas' });
    
    db.query(sqlHistorico, [idUsuario], (err, resultsHistorico) => {
      if (err) return res.status(500).json({ erro: 'Erro no historico' });

      const historicoFormatado = resultsHistorico.map(c => {
         let statusApp = 'Realizada';
         if (c.status_db === 'Cancelada' || c.status_db === 'Faltou') statusApp = 'Cancelada';
         return { ...c, status: statusApp };
      });

      res.json({ proximasConsultas: resultsAtivas, historicoConsultas: historicoFormatado });
    });
  });
});

app.get('/especialidades', (req, res) => {
  const sql = "SELECT id_especialidade AS id, tipo_especialidade AS nome FROM especialidades ORDER BY tipo_especialidade ASC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json(results);
  });
});

app.get('/especialidades/:id/medicos', (req, res) => {
  const idEspecialidade = req.params.id;
  const sql = `SELECT p.id_perfil AS id_perfil_medico, u.nome_usuario AS nome, u.sobrenome_usuario AS sobrenome FROM especialidades_medico em JOIN perfis p ON em.medico = p.id_perfil JOIN usuarios u ON p.usuario = u.id_usuario WHERE em.especialidade = ? AND u.status_usuario = 'Ativo'`;
  db.query(sql, [idEspecialidade], (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json(results);
  });
});

app.get('/medico/:id/agenda/dias', (req, res) => {
  const idMedico = req.params.id;
  const { ano, mes } = req.query;
  const sql = `SELECT DISTINCT DATE_FORMAT(data_agenda, '%d') as dia FROM agenda_medico WHERE medico = ? AND YEAR(data_agenda) = ? AND MONTH(data_agenda) = ?`;
  db.query(sql, [idMedico, ano, mes], (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    const dias = results.map(r => parseInt(r.dia, 10));
    res.json(dias);
  });
});

app.get('/medico/:id/agenda/horarios', (req, res) => {
  const idMedico = req.params.id;
  const data = req.query.data;
  const sqlTurno = `SELECT hora_inicio, hora_fim, id_agenda FROM agenda_medico WHERE medico = ? AND data_agenda = ?`;
  db.query(sqlTurno, [idMedico, data], (err, turnos) => {
    if (err || turnos.length === 0) return res.json([]);
    const turno = turnos[0];
    const sqlConsultas = `SELECT DATE_FORMAT(data_hora_consulta_inicio, '%H:%i') as hora_ocupada FROM consultas WHERE medico = ? AND DATE(data_hora_consulta_inicio) = ? AND status_consulta != 'Cancelada'`;
    db.query(sqlConsultas, [idMedico, data], (err, consultasDB) => {
      const horariosOcupados = consultasDB ? consultasDB.map(c => c.hora_ocupada) : [];
      let horariosGerados = [];
      let horaAtual = new Date(`1970-01-01T${turno.hora_inicio}Z`);
      const horaFinal = new Date(`1970-01-01T${turno.hora_fim}Z`);
      while (horaAtual < horaFinal) {
        let horaString = horaAtual.toISOString().substr(11, 5);
        let statusHorario = horariosOcupados.includes(horaString) ? 'ocupado' : 'livre';
        horariosGerados.push({ id_agenda: turno.id_agenda, hora: horaString, status: statusHorario });
        horaAtual.setMinutes(horaAtual.getMinutes() + 30);
      }
      res.json(horariosGerados);
    });
  });
});

app.post('/agendar', (req, res) => {
  const { paciente_id, medico_id, data, hora_inicio, status_horario } = req.body;
  const horaInicioDate = new Date(`1970-01-01T${hora_inicio}:00Z`);
  horaInicioDate.setMinutes(horaInicioDate.getMinutes() + 30);
  const hora_fim = horaInicioDate.toISOString().substr(11, 5);
  const dataHoraInicio = `${data} ${hora_inicio}:00`;
  const dataHoraFim = `${data} ${hora_fim}:00`;

  const sqlDescobrePerfil = "SELECT id_perfil FROM perfis WHERE usuario = ? AND tipo_perfil = 'Paciente' LIMIT 1";

  db.query(sqlDescobrePerfil, [paciente_id], (errPerfil, resultsPerfil) => {
    if (errPerfil || resultsPerfil.length === 0) return res.status(500).json({ erro: 'Erro interno' });
    const idPerfilPaciente = resultsPerfil[0].id_perfil;

    if (status_horario === 'livre') {
      const sql = "INSERT INTO consultas (paciente, medico, data_hora_consulta_inicio, data_hora_consulta_fim, status_consulta) VALUES (?, ?, ?, ?, 'Agendada')";
      db.query(sql, [idPerfilPaciente, medico_id, dataHoraInicio, dataHoraFim], (err, result) => {
        if (err) return res.status(500).json({ erro: 'Erro' });
        res.status(201).json({ mensagem: 'Sucesso!' });
      });

    } else if (status_horario === 'ocupado') {
      const sqlBuscaConsulta = "SELECT id_consulta, paciente, status_consulta FROM consultas WHERE medico = ? AND data_hora_consulta_inicio = ? AND status_consulta != 'Cancelada' ORDER BY id_consulta DESC LIMIT 1";
      
      db.query(sqlBuscaConsulta, [medico_id, dataHoraInicio], (errConsulta, resultsConsulta) => {
        if (errConsulta) return res.status(500).json({ erro: 'Erro interno' });
        
        if (resultsConsulta.length === 0) {
          return res.status(400).json({ erro: 'Este horário não está mais ocupado.' });
        }

        const consultaOcupada = resultsConsulta[0];
        const idConsultaOcupada = consultaOcupada.id_consulta;
        const donoDaConsulta = consultaOcupada.paciente;
        const statusConsulta = consultaOcupada.status_consulta;

        const sqlVerificaFila = "SELECT id_lista_espera FROM listas_espera WHERE consulta = ? AND paciente = ? AND status_lista_espera = 'Ativa' LIMIT 1";
        
        db.query(sqlVerificaFila, [idConsultaOcupada, idPerfilPaciente], (errVerifica, resultsVerifica) => {
          if (errVerifica) return res.status(500).json({ erro: 'Erro interno ao verificar fila' });

          if (resultsVerifica.length > 0) {
            return res.status(400).json({ erro: 'Você já está aguardando na fila de espera para este horário.' });
          }

          if (donoDaConsulta === idPerfilPaciente) {
            return res.status(400).json({ erro: 'Você já possui uma consulta neste exato horário.' });
          }

          if (statusConsulta !== 'Agendada') {
            return res.status(400).json({ 
              erro: 'Não é possível entrar na fila. Este horário já foi concluído, cancelado ou o paciente faltou.' 
            });
          }

          const sqlFila = "INSERT INTO listas_espera (consulta, paciente, status_lista_espera) VALUES (?, ?, 'Ativa')";
          
          db.query(sqlFila, [idConsultaOcupada, idPerfilPaciente], (err, result) => {
            if (err) return res.status(500).json({ erro: 'Erro ao entrar na fila' });
            res.status(201).json({ mensagem: 'Fila!' });
          });
        });
      });
    }
  });
});

app.get('/perfil/:id', (req, res) => {
  const idUsuario = req.params.id;
  const sql = `SELECT nome_usuario, sobrenome_usuario, email_usuario, cpf_usuario, DATE_FORMAT(data_nascimento_usuario, '%d/%m/%Y') AS data_nasc, sexo_usuario FROM usuarios WHERE id_usuario = ?`;
  db.query(sql, [idUsuario], (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ erro: 'Erro' });
    res.json(results[0]);
  });
});

app.put('/perfil/:id', (req, res) => {
  const idUsuario = req.params.id;
  const { nome, sobrenome, email } = req.body;
  const sql = `UPDATE usuarios SET nome_usuario = ?, sobrenome_usuario = ?, email_usuario = ? WHERE id_usuario = ?`;
  db.query(sql, [nome, sobrenome, email, idUsuario], (err, result) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json({ mensagem: 'Sucesso!' });
  });
});

app.get('/paciente/:id/fila', (req, res) => {
  const idUsuario = req.params.id;
  
  const sql = `
    SELECT 
      le.id_lista_espera AS id, 
      CONCAT('Dr. ', um.nome_usuario) AS medico, 
      e.tipo_especialidade AS especialidade, 
      DATE_FORMAT(c.data_hora_consulta_inicio, '%d/%m, %H:%i') AS dataHora, 
      le.status_lista_espera,
      
      -- A MÁGICA AQUI: Calcula a posição exata e em tempo real na fila!
      (
        SELECT COUNT(*) 
        FROM listas_espera le2 
        WHERE le2.consulta = le.consulta 
          AND le2.status_lista_espera = 'Ativa' 
          AND le2.id_lista_espera <= le.id_lista_espera
      ) AS posicao
      
    FROM listas_espera le 
    JOIN consultas c ON le.consulta = c.id_consulta 
    JOIN perfis pm ON c.medico = pm.id_perfil 
    JOIN usuarios um ON pm.usuario = um.id_usuario 
    JOIN perfis pp ON le.paciente = pp.id_perfil 
    LEFT JOIN especialidades_medico em ON pm.id_perfil = em.medico 
    LEFT JOIN especialidades e ON em.especialidade = e.id_especialidade 
    WHERE pp.usuario = ? AND le.status_lista_espera = 'Ativa' 
    ORDER BY c.data_hora_consulta_inicio ASC
  `;

  db.query(sql, [idUsuario], (err, results) => {
    if (err) {
      console.error("Erro ao buscar fila do paciente:", err);
      return res.status(500).json({ erro: 'Erro interno' });
    }
    
    res.json(results);
  });
});

app.put('/fila/:id/sair', (req, res) => {
  const idFila = req.params.id;
  const sql = "UPDATE listas_espera SET status_lista_espera = 'Desativada' WHERE id_lista_espera = ?";
  db.query(sql, [idFila], (err, result) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json({ mensagem: 'Sucesso.' });
  });
});

app.get('/adm/:id/perfil', (req, res) => {
  const idUsuario = req.params.id;
  const sql = "SELECT nome_usuario, sobrenome_usuario FROM usuarios WHERE id_usuario = ?";
  db.query(sql, [idUsuario], (err, results) => {
    if (err || results.length === 0) return res.status(500).json({ erro: 'Erro' });
    res.json(results[0]);
  });
});

app.post('/agendas', (req, res) => {
  const { medico_id, especialidade_id, data, hora_inicio, hora_fim } = req.body;
  if (!medico_id || !especialidade_id || !data || !hora_inicio || !hora_fim) return res.status(400).json({ erro: 'Preencha tudo' });
  const sql = `INSERT INTO agenda_medico (medico, especialidade, data_agenda, hora_inicio, hora_fim, status_agenda) VALUES (?, ?, ?, ?, ?, 'Disponivel')`;
  db.query(sql, [medico_id, especialidade_id, data, hora_inicio, hora_fim], (err, result) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.status(201).json({ mensagem: 'Sucesso!' });
  });
});

//-----------------ROTAS EXCLUSIVAS PARA MEDICO--------------

app.patch('/consulta/:id/falta', (req, res) => {
  const sql = "UPDATE consultas SET status_consulta = 'Faltou' WHERE id_consulta = ?";
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json({ mensagem: 'Sucesso' });
  });
});

app.patch('/consulta/:id/concluir', (req, res) => {
  const sql = "UPDATE consultas SET status_consulta = 'Concluida' WHERE id_consulta = ?";
  db.query(sql, [req.params.id], (err) => {
    if (err) return res.status(500).json({ erro: 'Erro' });
    res.json({ mensagem: 'Sucesso' });
  });
});

app.get('/medico/:id/dashboard', async (req, res) => {
  const idUsuario = req.params.id;

  try {
    const [medicoRows] = await db.promise().query(`
      SELECT p.id_perfil, u.nome_usuario as nome, u.sobrenome_usuario as sobrenome
      FROM usuarios u
      JOIN perfis p ON u.id_usuario = p.usuario
      WHERE u.id_usuario = ? AND p.tipo_perfil = 'Medico'
    `, [idUsuario]);

    if (medicoRows.length === 0) {
      return res.status(404).json({ erro: true, mensagem: 'Médico não encontrado' });
    }

    const idPerfil = medicoRows[0].id_perfil;

    const [proximaRows] = await db.promise().query(`
      SELECT c.data_hora_consulta_inicio, u.nome_usuario as paciente
      FROM consultas c
      JOIN perfis p ON c.paciente = p.id_perfil
      JOIN usuarios u ON p.usuario = u.id_usuario
      WHERE c.medico = ? AND c.status_consulta = 'Agendada' AND c.data_hora_consulta_inicio >= NOW()
      ORDER BY c.data_hora_consulta_inicio ASC
      LIMIT 1
    `, [idPerfil]);

    let proximaConsulta = null;
    if (proximaRows.length > 0) {
      const dataIso = new Date(proximaRows[0].data_hora_consulta_inicio);
      proximaConsulta = {
        paciente: proximaRows[0].paciente,
        hora: dataIso.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    }

    const [statsRows] = await db.promise().query(`
      SELECT
        SUM(CASE WHEN DATE(data_hora_consulta_inicio) = CURDATE() THEN 1 ELSE 0 END) as consultas_hoje,
        SUM(CASE WHEN MONTH(data_hora_consulta_inicio) = MONTH(CURDATE()) AND YEAR(data_hora_consulta_inicio) = YEAR(CURDATE()) THEN 1 ELSE 0 END) as consultas_mes,
        SUM(CASE WHEN status_consulta = 'Concluida' THEN 1 ELSE 0 END) as total_atendimentos
      FROM consultas
      WHERE medico = ?
    `, [idPerfil]);

    const [agendasRows] = await db.promise().query(`
      SELECT
        DATE_FORMAT(data_agenda, '%Y-%m-%d') as data_agenda,
        TIME_FORMAT(hora_inicio, '%H:%i') as hora_inicio,
        TIME_FORMAT(hora_fim, '%H:%i') as hora_fim,
        status_agenda
      FROM agenda_medico
      WHERE medico = ? AND data_agenda >= CURDATE()
    `, [idPerfil]);

    const [historicoRows] = await db.promise().query(`
      SELECT MONTH(data_hora_consulta_inicio) as mes, COUNT(*) as qtd
      FROM consultas
      WHERE medico = ? AND status_consulta = 'Concluida' AND YEAR(data_hora_consulta_inicio) = YEAR(CURDATE())
      GROUP BY MONTH(data_hora_consulta_inicio)
    `, [idPerfil]);

    let historicoAnual = new Array(12).fill(0);
    historicoRows.forEach(row => {
      historicoAnual[row.mes - 1] = row.qtd;
    });

    res.json({
      erro: false,
      medico: { nome: medicoRows[0].nome, sobrenome: medicoRows[0].sobrenome },
      proximaConsulta: proximaConsulta,
      estatisticas: {
        consultas_hoje: statsRows[0].consultas_hoje || 0,
        consultas_mes: statsRows[0].consultas_mes || 0,
        total_atendimentos: statsRows[0].total_atendimentos || 0
      },
      agendas: agendasRows,
      historicoAnual: historicoAnual
    });

  } catch (error) {
    console.error("Erro no Dashboard do Médico:", error);
    res.status(500).json({ erro: true, mensagem: 'Erro interno no servidor' });
  }
});

app.get('/medico/:idUsuario/agenda/semana', (req, res) => {
  const idUsuario = req.params.idUsuario;
  const sql = `SELECT DISTINCT DATE_FORMAT(am.data_agenda, '%d') as dia, DATE_FORMAT(am.data_agenda, '%m') as mes, DATE_FORMAT(am.data_agenda, '%Y-%m-%d') as data_completa FROM agenda_medico am JOIN perfis p ON am.medico = p.id_perfil WHERE p.usuario = ? ORDER BY am.data_agenda DESC LIMIT 15`;
  
  db.query(sql, [idUsuario], (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro interno' });
    const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const datasFormatadas = results.map(row => {
      const dataObj = new Date(`${row.data_completa}T12:00:00Z`);
      return { dia: row.dia, mes: row.mes, data_completa: row.data_completa, semana: diasNomes[dataObj.getDay()] };
    });
    res.json(datasFormatadas);
  });
});

app.get('/agenda-v2/semana/:idUsuario', (req, res) => {
  const idUsuario = req.params.idUsuario;
  const sql = `SELECT DISTINCT DATE_FORMAT(am.data_agenda, '%d') as dia, DATE_FORMAT(am.data_agenda, '%m') as mes, DATE_FORMAT(am.data_agenda, '%Y-%m-%d') as data_completa FROM agenda_medico am JOIN perfis p ON am.medico = p.id_perfil WHERE p.usuario = ? ORDER BY am.data_agenda DESC LIMIT 15`;
  
  db.query(sql, [idUsuario], (err, results) => {
    if (err) return res.status(500).json({ erro: 'Erro interno' });
    const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const datasFormatadas = results.map(row => {
      const dataObj = new Date(`${row.data_completa}T12:00:00Z`);
      return { dia: row.dia, mes: row.mes, data_completa: row.data_completa, semana: diasNomes[dataObj.getDay()] };
    });
    console.log(`\n✅ [AGENDA VIP] Datas enviadas para o Usuário ${idUsuario}:`, datasFormatadas);
    res.json(datasFormatadas);
  });
});

app.get('/medico/:idUsuario/agenda/dia', (req, res) => {
  const idUsuario = req.params.idUsuario;
  const { data } = req.query;

  const sqlPerfil = "SELECT id_perfil FROM perfis WHERE usuario = ? AND tipo_perfil LIKE 'Medic%'";
  
  db.query(sqlPerfil, [idUsuario], (err, perfis) => {
    if (err || perfis.length === 0) return res.json([]);
    const idPerfil = perfis[0].id_perfil;

    const sqlTurno = "SELECT hora_inicio, hora_fim FROM agenda_medico WHERE medico = ? AND data_agenda = ?";
    
    db.query(sqlTurno, [idPerfil, data], (err, turnos) => {
      if (err || turnos.length === 0) return res.json([]);
      const turno = turnos[0];

      const sqlConsultas = `SELECT c.id_consulta AS id, DATE_FORMAT(c.data_hora_consulta_inicio, '%H:%i') AS hora, CONCAT(up.nome_usuario, ' ', up.sobrenome_usuario) AS paciente, c.status_consulta AS status_db FROM consultas c JOIN perfis pp ON c.paciente = pp.id_perfil JOIN usuarios up ON pp.usuario = up.id_usuario WHERE c.medico = ? AND DATE(c.data_hora_consulta_inicio) = ? AND c.status_consulta != 'Cancelada'`;

      db.query(sqlConsultas, [idPerfil, data], (err, consultasDB) => {
        if (err) return res.status(500).json({ erro: 'Erro interno' });

        let agendaCompleta = [];
        let horaAtual = new Date(`1970-01-01T${turno.hora_inicio}Z`); 
        const horaFinal = new Date(`1970-01-01T${turno.hora_fim}Z`);

        while (horaAtual < horaFinal) {
          let horaString = horaAtual.toISOString().substr(11, 5); 
          let consultaEncontrada = consultasDB.find(c => c.hora === horaString);

          if (consultaEncontrada) {
            let statusVisual = 'Aguardando';
            if (consultaEncontrada.status_db === 'Concluida') statusVisual = 'Atendido';
            if (consultaEncontrada.status_db === 'Faltou') statusVisual = 'Faltou';

            agendaCompleta.push({ 
              id: String(consultaEncontrada.id), 
              hora: horaString, 
              paciente: consultaEncontrada.paciente, 
              tipo: 'Consulta Padrão', 
              status: statusVisual 
            });
          } else {
            agendaCompleta.push({ 
              id: `livre-${horaString}`, 
              hora: horaString, 
              paciente: 'Livre', 
              tipo: '-', 
              status: 'Livre' 
            });
          }
          horaAtual.setMinutes(horaAtual.getMinutes() + 30);
        }
        res.json(agendaCompleta);
      });
    });
  });
});

//--------------------------TESTANDO TELA LEGENDA-------------------------------

app.get('/api/agenda-medico/:idUsuario/semana', (req, res) => {
  const idUsuario = req.params.idUsuario;
  
  console.log(`\n======================================`);
  console.log(`[BACKEND - PASSO 1] Requisição recebida para o Usuário: ${idUsuario}`);

  const sql = `
    SELECT DISTINCT 
      DATE_FORMAT(am.data_agenda, '%d') as dia,
      DATE_FORMAT(am.data_agenda, '%m') as mes,
      DATE_FORMAT(am.data_agenda, '%Y-%m-%d') as data_completa
    FROM agenda_medico am
    JOIN perfis p ON am.medico = p.id_perfil
    WHERE p.usuario = ?
  `;

  console.log(`[BACKEND - PASSO 2] Rodando a Query SQL...`);

  db.query(sql, [idUsuario], (err, results) => {
    if (err) {
      console.error(`[BACKEND - PASSO 3] ERRO NO MYSQL:`, err);
      return res.status(500).json({ erro: 'Erro interno' });
    }
    
    console.log(`[BACKEND - PASSO 3] Resultado direto do Banco (results):`, results);

    const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const datasFormatadas = results.map(row => {
      const dataObj = new Date(`${row.data_completa}T12:00:00Z`);
      return { dia: row.dia, mes: row.mes, data_completa: row.data_completa, semana: diasNomes[dataObj.getDay()] };
    });
    
    console.log(`[BACKEND - PASSO 4] Dados formatados que serão enviados ao App:`, datasFormatadas);
    console.log(`======================================\n`);
    
    res.json(datasFormatadas);
  });
});

app.get('/api/agenda-medico/:idUsuario/dia', (req, res) => {
  const idUsuario = req.params.idUsuario;
  const { data } = req.query; 

  const sqlPerfil = "SELECT id_perfil FROM perfis WHERE usuario = ? AND tipo_perfil = 'Medico'";
  
  db.query(sqlPerfil, [idUsuario], (err, perfis) => {
    if (err || perfis.length === 0) return res.json([]);
    const idPerfil = perfis[0].id_perfil;

    const sqlTurno = "SELECT hora_inicio, hora_fim FROM agenda_medico WHERE medico = ? AND data_agenda = ?";
    
    db.query(sqlTurno, [idPerfil, data], (err, turnos) => {
      if (err || turnos.length === 0) return res.json([]);
      const turno = turnos[0];

      const sqlConsultas = `
        SELECT 
          c.id_consulta AS id, 
          DATE_FORMAT(c.data_hora_consulta_inicio, '%H:%i') AS hora, 
          CONCAT(up.nome_usuario, ' ', up.sobrenome_usuario) AS paciente, 
          c.status_consulta AS status_db
        FROM consultas c
        JOIN perfis pp ON c.paciente = pp.id_perfil
        JOIN usuarios up ON pp.usuario = up.id_usuario
        WHERE c.medico = ? AND DATE(c.data_hora_consulta_inicio) = ? AND c.status_consulta != 'Cancelada'
      `;

      db.query(sqlConsultas, [idPerfil, data], (err, consultasDB) => {
        if (err) return res.status(500).json({ erro: 'Erro interno' });
        
        let agendaCompleta = [];
        let horaAtual = new Date(`1970-01-01T${turno.hora_inicio}Z`); 
        const horaFinal = new Date(`1970-01-01T${turno.hora_fim}Z`);

        while (horaAtual < horaFinal) {
          let horaString = horaAtual.toISOString().substr(11, 5); 
          let consultaEncontrada = consultasDB.find(c => c.hora === horaString);

          if (consultaEncontrada) {
            let statusVisual = 'Aguardando';
            if (consultaEncontrada.status_db === 'Concluida') statusVisual = 'Atendido';
            if (consultaEncontrada.status_db === 'Faltou') statusVisual = 'Faltou';
            agendaCompleta.push({ id: String(consultaEncontrada.id), hora: horaString, paciente: consultaEncontrada.paciente, tipo: 'Consulta Padrão', status: statusVisual });
          } else {
            agendaCompleta.push({ id: `livre-${horaString}`, hora: horaString, paciente: 'Livre', tipo: '-', status: 'Livre' });
          }
          horaAtual.setMinutes(horaAtual.getMinutes() + 30);
        }
        res.json(agendaCompleta);
      });
    });
  });
});

app.patch('/perfil/:id/desativar', (req, res) => {
  const idUsuario = req.params.id;
  const sql = "UPDATE usuarios SET status_usuario = 'Desativado' WHERE id_usuario = ?";
  
  db.query(sql, [idUsuario], (err, result) => {
    if (err) {
      console.error("Erro ao desativar conta:", err);
      return res.status(500).json({ erro: 'Erro ao desativar conta' });
    }
    res.json({ mensagem: 'Conta desativada com sucesso' });
  });
});

//----------ROTA PARA O ADM ENCERRAR A LISTA DE ESPERA INTEIRA-------------
app.put('/listas-espera/:idConsulta/encerrar', (req, res) => {
  const idConsulta = req.params.idConsulta;
  
  const sql = "UPDATE listas_espera SET status_lista_espera = 'Desativada' WHERE consulta = ?";

  db.query(sql, [idConsulta], (err, result) => {
    if (err) {
      console.error("Erro ao encerrar lista de espera:", err);
      return res.status(500).json({ erro: 'Erro ao encerrar lista' });
    }
    res.json({ mensagem: 'Lista de espera encerrada com sucesso.' });
  });
});

app.patch('/listas-espera/paciente/:idLista/remover', (req, res) => {
  const idLista = req.params.idLista;
  
  const sql = "UPDATE listas_espera SET status_lista_espera = 'Desativada' WHERE id_lista_espera = ?";

  db.query(sql, [idLista], (err, result) => {
    if (err) {
      console.error("Erro ao remover paciente da fila:", err);
      return res.status(500).json({ erro: 'Erro interno' });
    }
    res.json({ mensagem: 'Paciente removido da fila com sucesso.' });
  });
});

//---------------ROTA DE NOTIFICAÇOES DINAMICAS DO PACIENTE-----------------
app.get('/paciente/:idUsuario/notificacoes', (req, res) => {
  const idUsuario = req.params.idUsuario;

  const sqlPerfil = "SELECT id_perfil FROM perfis WHERE usuario = ? AND tipo_perfil = 'Paciente'";
  
  db.query(sqlPerfil, [idUsuario], (err, perfis) => {
    if (err || perfis.length === 0) return res.json([]);
    const idPerfil = perfis[0].id_perfil;

    const sqlCanceladas = `SELECT id_consulta, CONCAT('Dr. ', um.nome_usuario) AS medico FROM consultas c JOIN perfis pm ON c.medico = pm.id_perfil JOIN usuarios um ON pm.usuario = um.id_usuario WHERE c.paciente = ? AND c.status_consulta = 'Cancelada' ORDER BY c.id_consulta DESC LIMIT 2`;

    const sqlConfirmadas = `SELECT id_consulta, CONCAT('Dr. ', um.nome_usuario) AS medico, DATE_FORMAT(c.data_hora_consulta_inicio, '%d/%m às %H:%i') AS dataHora FROM consultas c JOIN perfis pm ON c.medico = pm.id_perfil JOIN usuarios um ON pm.usuario = um.id_usuario WHERE c.paciente = ? AND c.status_consulta = 'Agendada' AND c.data_hora_consulta_inicio >= NOW() ORDER BY c.data_hora_consulta_inicio ASC LIMIT 2`;

    db.query(sqlCanceladas, [idPerfil], (err, canceladas) => {
      db.query(sqlConfirmadas, [idPerfil], (err, confirmadas) => {
        let notificacoes = [];

        if (confirmadas && confirmadas.length > 0) {
          confirmadas.forEach(c => notificacoes.push({
            id: `conf-${c.id_consulta}`, tipo: 'sucesso', titulo: 'Consulta Confirmada', desc: `Sua consulta com ${c.medico} está confirmada para ${c.dataHora}.`, tempo: 'Novo'
          }));
        }

        if (canceladas && canceladas.length > 0) {
          canceladas.forEach(c => notificacoes.push({
            id: `canc-${c.id_consulta}`, tipo: 'erro', titulo: 'Consulta Cancelada', desc: `Atenção: Sua consulta com ${c.medico} foi cancelada.`, tempo: 'Recente'
          }));
        }

        notificacoes.push({ id: 'welcome', tipo: 'info', titulo: 'Conta criada', desc: 'Bem-vindo ao CliniFlow! Seu perfil está pronto para uso.', tempo: 'Sistema' });

        res.json(notificacoes);
      });
    });
  });
});

//---------------ROTA DE NOTIFICAÇOES DINAMICAS DO MEDICO-------------
app.get('/medico/:idUsuario/notificacoes', (req, res) => {
  const idUsuario = req.params.idUsuario;

  const sqlPerfil = "SELECT id_perfil FROM perfis WHERE usuario = ? AND tipo_perfil = 'Medico'";

  db.query(sqlPerfil, [idUsuario], (err, perfis) => {
    if (err || perfis.length === 0) return res.json([]);
    const idPerfil = perfis[0].id_perfil;

    const sqlCanceladas = `SELECT c.id_consulta, CONCAT(up.nome_usuario) AS paciente, DATE_FORMAT(c.data_hora_consulta_inicio, '%d/%m') AS dataHora FROM consultas c JOIN perfis pp ON c.paciente = pp.id_perfil JOIN usuarios up ON pp.usuario = up.id_usuario WHERE c.medico = ? AND c.status_consulta = 'Cancelada' ORDER BY c.id_consulta DESC LIMIT 2`;

    const sqlNovas = `SELECT c.id_consulta, CONCAT(up.nome_usuario) AS paciente, DATE_FORMAT(c.data_hora_consulta_inicio, '%d/%m às %H:%i') AS dataHora FROM consultas c JOIN perfis pp ON c.paciente = pp.id_perfil JOIN usuarios up ON pp.usuario = up.id_usuario WHERE c.medico = ? AND c.status_consulta = 'Agendada' AND c.data_hora_consulta_inicio >= NOW() ORDER BY c.id_consulta DESC LIMIT 2`;

    db.query(sqlCanceladas, [idPerfil], (err, canceladas) => {
      db.query(sqlNovas, [idPerfil], (err, novas) => {
        let notificacoes = [];

        if (novas && novas.length > 0) {
          novas.forEach(c => notificacoes.push({
            id: `nova-${c.id_consulta}`, tipo: 'sucesso', titulo: 'Novo Agendamento', desc: `O paciente ${c.paciente} agendou uma consulta para ${c.dataHora}.`, tempo: 'Novo'
          }));
        }

        if (canceladas && canceladas.length > 0) {
          canceladas.forEach(c => notificacoes.push({
            id: `canc-${c.id_consulta}`, tipo: 'erro', titulo: 'Consulta Cancelada', desc: `O paciente ${c.paciente} cancelou a consulta do dia ${c.dataHora}.`, tempo: 'Recente'
          }));
        }

        notificacoes.push({ id: 'welcome-med', tipo: 'info', titulo: 'Painel Ativo', desc: 'Bem-vindo ao CliniFlow! Sua agenda está pronta para organizar seus atendimentos.', tempo: 'Sistema' });

        res.json(notificacoes);
      });
    });
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});