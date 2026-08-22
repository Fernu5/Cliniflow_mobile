import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView, 
  Platform,
  StatusBar as RNStatusBar,
  Alert,
  Switch,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DetalhesUsuarioScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 

  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [crm, setCrm] = useState(''); 
  const [dataNascimento, setDataNascimento] = useState(''); // Novo campo
  const [sexo, setSexo] = useState('M'); // Novo campo
  const [tipo, setTipo] = useState(''); 
  const [iniciais, setIniciais] = useState('');
  const [isAtivo, setIsAtivo] = useState(true);
  
  const [idPerfil, setIdPerfil] = useState(null); 
  
  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState<any>(null);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false); 

  // 🔴 COLOQUE O SEU IP AQUI
  const IP = '192.168.1.12';

  useEffect(() => {
    const buscarUsuario = async () => {
      try {
        const resposta = await fetch(`http://${IP}:3000/usuario/${id}`);
        const dados = await resposta.json();
        
        if (dados && !dados.erro) {
          setNome(dados.nome || '');
          setSobrenome(dados.sobrenome || ''); 
          setEmail(dados.email || '');
          setCpf(dados.cpf || '');
          setCrm(dados.crm || '');
          setDataNascimento(dados.nascimento || ''); // Preenche a data
          setSexo((dados.sexo === 'Feminino' || dados.sexo === 'F') ? 'F' : 'M'); // Preenche o sexo
          setIdPerfil(dados.id_perfil);
          
          const tipoFormatado = dados.tipo === 'Medico' ? 'Médico' : dados.tipo;
          setTipo(tipoFormatado);
          setIsAtivo(dados.status === 'Ativo');

          const letraNome = dados.nome ? dados.nome[0] : 'U';
          const letraSobrenome = dados.sobrenome ? dados.sobrenome[0] : 'N';
          setIniciais(`${letraNome}${letraSobrenome}`.toUpperCase());

          if (dados.tipo === 'Medico') {
            const respEsp = await fetch(`http://${IP}:3000/especialidades`);
            const listaEsp = await respEsp.json();
            setEspecialidades(listaEsp);

            const respEspAtual = await fetch(`http://${IP}:3000/medico/${dados.id_perfil}/especialidade`);
            const espAtual = await respEspAtual.json();
            
            if (espAtual.id_especialidade) {
              const espEncontrada = listaEsp.find(e => e.id === espAtual.id_especialidade || e.id_especialidade === espAtual.id_especialidade);
              setEspecialidadeSelecionada(espEncontrada);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      } finally {
        setCarregando(false);
      }
    };

    if (id) buscarUsuario();
  }, [id]);

  const handleDataChange = (texto: string) => {
    let valor = texto.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.slice(0, 8);
    if (valor.length > 4) {
      valor = valor.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/(\d{2})(\d{1,2})/, '$1/$2');
    }
    setDataNascimento(valor);
  };

  const handleSalvar = async () => {
    // Validação da Data antes de enviar para o banco
    const partesData = dataNascimento.split('/');
    if (partesData.length !== 3 || dataNascimento.length !== 10) {
      Alert.alert("Erro", "Digite a data de nascimento no formato DD/MM/AAAA");
      return;
    }
    const dataMySQL = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

    setSalvando(true);
    try {
      const respostaUsuario = await fetch(`http://${IP}:3000/usuario/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        // Agora envia também a data formatada e o sexo
        body: JSON.stringify({ nome, sobrenome, email, cpf, crm, dataNascimento: dataMySQL, sexo })
      });
      
      if ((tipo === 'Médico' || tipo === 'Medico') && idPerfil) {
        await fetch(`http://${IP}:3000/medico/${idPerfil}/especialidade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            id_especialidade: especialidadeSelecionada ? (especialidadeSelecionada.id || especialidadeSelecionada.id_especialidade) : null 
          })
        });
      }

      if (respostaUsuario.ok) {
        Alert.alert("Sucesso", "Dados do usuário atualizados no sistema.");
        router.back();
      } else {
        Alert.alert("Erro", "Não foi possível salvar as alterações.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  const toggleStatus = () => {
    const novoStatusVisual = !isAtivo;
    const statusBanco = novoStatusVisual ? 'Ativo' : 'Desativado';
    const acao = isAtivo ? "Desativar" : "Reativar";

    Alert.alert(
      `${acao} Usuário`,
      isAtivo 
        ? "Ao inativar, este usuário não poderá mais fazer login. Deseja continuar?" 
        : "Deseja reativar o acesso deste usuário?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: `Sim, ${acao}`, 
          style: isAtivo ? "destructive" : "default", 
          onPress: async () => {
            try {
              await fetch(`http://${IP}:3000/usuario/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: statusBanco })
              });
              setIsAtivo(novoStatusVisual);
            } catch (error) {
              Alert.alert("Erro", "Não foi possível mudar o status.");
            }
          } 
        }
      ]
    );
  };

  const handleResetarSenha = () => {
    Alert.alert(
      "Resetar Senha",
      `Um e-mail de recuperação será enviado para ${email}. Deseja confirmar?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, Enviar", onPress: () => Alert.alert("Enviado", "E-mail de recuperação enviado com sucesso.") }
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#12A388" />
          <Text style={styles.headerTitle}>Detalhes do Usuário</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#12A388" />
          <Text style={{ marginTop: 12, color: '#A0AEC0' }}>Carregando ficha...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.profileSummary}>
            <View style={[styles.avatar, tipo === 'Paciente' ? styles.bgTealLight : styles.bgPurpleLight]}>
              <Text style={[styles.avatarText, tipo === 'Paciente' ? styles.textTeal : styles.textPurple]}>{iniciais}</Text>
            </View>
            <Text style={styles.userName}>{nome} {sobrenome}</Text>
            <View style={styles.badgesRow}>
              <View style={[styles.badge, tipo === 'Paciente' ? styles.bgTealLight : styles.bgPurpleLight]}>
                <Text style={[styles.badgeText, tipo === 'Paciente' ? styles.textTeal : styles.textPurple]}>{tipo}</Text>
              </View>
              <View style={[styles.badge, isAtivo ? styles.bgGreenLight : styles.bgGrayLight, { marginLeft: 8 }]}>
                <Text style={[styles.badgeText, isAtivo ? styles.textGreen : styles.textGray]}>{isAtivo ? 'Ativo' : 'Inativo'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Informações Pessoais</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput style={styles.input} value={nome} onChangeText={setNome} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sobrenome</Text>
              <TextInput style={styles.input} value={sobrenome} onChangeText={setSobrenome} />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Data de Nascimento</Text>
              <TextInput 
                style={styles.input} 
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#A0AEC0" 
                value={dataNascimento} 
                onChangeText={handleDataChange}
                keyboardType="numeric" 
                maxLength={10}
              />
            </View>

            <View style={styles.sexoContainer}>
              <Text style={styles.sexoLabel}>Sexo</Text>
              <TouchableOpacity style={styles.radioOption} onPress={() => setSexo('M')}>
                <View style={[styles.radioOuter, sexo === 'M' && styles.radioOuterSelected]}>
                  {sexo === 'M' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioText}>M</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioOption} onPress={() => setSexo('F')}>
                <View style={[styles.radioOuter, sexo === 'F' && styles.radioOuterSelected]}>
                  {sexo === 'F' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.radioText}>F</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CPF</Text>
              <TextInput style={styles.input} value={cpf} onChangeText={setCpf} keyboardType="numeric" />
            </View>

            {tipo === 'Médico' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CRM (Registro Médico)</Text>
                  <TextInput style={styles.input} value={crm} onChangeText={setCrm} />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Especialidade Atendida</Text>
                  <TouchableOpacity 
                    style={styles.dropdownButton} 
                    onPress={() => setMostrarDropdown(!mostrarDropdown)}
                  >
                    <Text style={[styles.dropdownText, !especialidadeSelecionada && styles.placeholderText]}>
                      {especialidadeSelecionada ? especialidadeSelecionada.nome || especialidadeSelecionada.nome_especialidade : 'Nenhuma especialidade vinculada'}
                    </Text>
                    <Ionicons name={mostrarDropdown ? "chevron-up" : "chevron-down"} size={20} color="#718096" />
                  </TouchableOpacity>
                  
                  {mostrarDropdown && (
                    <View style={styles.dropdownOptions}>
                      <TouchableOpacity 
                        style={styles.optionItem}
                        onPress={() => {
                          setEspecialidadeSelecionada(null);
                          setMostrarDropdown(false);
                        }}
                      >
                        <Text style={[styles.optionText, {color: '#E53E3E'}]}>Remover Especialidade</Text>
                      </TouchableOpacity>
                      
                      {especialidades.map((esp) => (
                        <TouchableOpacity 
                          key={esp.id || esp.id_especialidade} 
                          style={styles.optionItem}
                          onPress={() => {
                            setEspecialidadeSelecionada(esp);
                            setMostrarDropdown(false);
                          }}
                        >
                          <Text style={styles.optionText}>{esp.nome || esp.nome_especialidade}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}

            <TouchableOpacity 
              style={[styles.submitButton, salvando && { opacity: 0.7 }]} 
              onPress={handleSalvar}
              disabled={salvando}
            >
              <Text style={styles.submitButtonText}>
                {salvando ? "Salvando..." : "Salvar Alterações"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Controle de Acesso</Text>
            
            <View style={styles.switchRow}>
              <View style={styles.switchTextContainer}>
                <Text style={styles.switchLabel}>Conta Ativa</Text>
                <Text style={styles.switchDesc}>Permite que o usuário acesse o sistema</Text>
              </View>
              <Switch
                trackColor={{ false: '#CBD5E0', true: '#12A388' }}
                thumbColor={'#FFFFFF'}
                onValueChange={toggleStatus}
                value={isAtivo}
              />
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleResetarSenha}>
              <Ionicons name="key-outline" size={20} color="#E53E3E" style={{ marginRight: 8 }} />
              <Text style={styles.resetButtonText}>Enviar Redefinição de Senha</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 16 : 16, paddingBottom: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 4 },
  scrollContent: { paddingBottom: 48 },
  profileSummary: { backgroundColor: '#FFF', alignItems: 'center', paddingVertical: 32, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { fontSize: 28, fontWeight: 'bold' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#2D3748', marginBottom: 12 },
  badgesRow: { flexDirection: 'row' },
  formContainer: { padding: 24, backgroundColor: '#FFF', marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#E2E8F0' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#4A5568', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#A0AEC0', marginBottom: 4, marginLeft: 4 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#2D3748', backgroundColor: '#F7FAFC' },
  
  // Estilos de Sexo
  sexoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: 4 },
  sexoLabel: { fontSize: 12, color: '#A0AEC0', marginRight: 16, marginLeft: 4 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  radioOuter: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E0', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  radioOuterSelected: { borderColor: '#12A388' },
  radioInner: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#12A388' },
  radioText: { fontSize: 16, color: '#2D3748' },

  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14 },
  dropdownText: { fontSize: 16, color: '#2D3748' },
  placeholderText: { color: '#A0AEC0' },
  dropdownOptions: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, marginTop: -4 },
  optionItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
  optionText: { fontSize: 16, color: '#4A5568' },

  submitButton: { backgroundColor: '#12A388', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  dangerZone: { padding: 24, backgroundColor: '#FFF', marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#FED7D7' },
  dangerTitle: { fontSize: 16, fontWeight: 'bold', color: '#E53E3E', marginBottom: 16 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  switchTextContainer: { flex: 1, paddingRight: 16 },
  switchLabel: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  switchDesc: { fontSize: 12, color: '#718096', marginTop: 2 },
  resetButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FEB2B2', borderRadius: 8, paddingVertical: 14 },
  resetButtonText: { color: '#E53E3E', fontSize: 16, fontWeight: 'bold' },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  bgTealLight: { backgroundColor: '#E6FFFA' }, textTeal: { color: '#319795' },
  bgPurpleLight: { backgroundColor: '#F3EBFF' }, textPurple: { color: '#805AD5' },
  bgGreenLight: { backgroundColor: '#F0FFF4' }, textGreen: { color: '#38A169' },
  bgGrayLight: { backgroundColor: '#EDF2F7' }, textGray: { color: '#718096' },
});