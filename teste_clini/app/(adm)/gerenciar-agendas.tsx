import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  TextInput,
  Platform, 
  StatusBar as RNStatusBar, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function GerenciarAgendasScreen() {
  const router = useRouter();

  const IP = '192.168.1.12';

  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [medicos, setMedicos] = useState<any[]>([]);

  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState<any>(null);
  const [medicoSelecionado, setMedicoSelecionado] = useState<any>(null);
  const [dataAgenda, setDataAgenda] = useState(''); // DD/MM/AAAA
  const [horaInicio, setHoraInicio] = useState(''); // HH:MM
  const [horaFim, setHoraFim] = useState(''); // HH:MM

  const [mostrarDropdownEsp, setMostrarDropdownEsp] = useState(false);
  const [mostrarDropdownMed, setMostrarDropdownMed] = useState(false);

  const [carregandoMedicos, setCarregandoMedicos] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // 1. Busca as especialidades ao abrir
  useEffect(() => {
    fetch(`http://${IP}:3000/especialidades`)
      .then(res => res.json())
      .then(dados => setEspecialidades(dados))
      .catch(err => console.error("Erro ao buscar especialidades:", err));
  }, []);

  // 2. Quando seleciona especialidade, busca os médicos vinculados a ela
  useEffect(() => {
    if (especialidadeSelecionada) {
      setCarregandoMedicos(true);
      setMedicoSelecionado(null);
      setMedicos([]);

      fetch(`http://${IP}:3000/especialidades/${especialidadeSelecionada.id}/medicos`)
        .then(res => res.json())
        .then(dados => setMedicos(dados))
        .catch(err => console.error("Erro ao buscar médicos:", err))
        .finally(() => setCarregandoMedicos(false));
    }
  }, [especialidadeSelecionada]);

  const aplicarMascaraData = (texto: string) => {
    let valor = texto.replace(/\D/g, '');
    if (valor.length > 8) valor = valor.slice(0, 8);
    if (valor.length > 4) {
      valor = valor.replace(/(\d{2})(\d{2})(\d{1,4})/, '$1/$2/$3');
    } else if (valor.length > 2) {
      valor = valor.replace(/(\d{2})(\d{1,2})/, '$1/$2');
    }
    setDataAgenda(valor);
  };

  // Máscara para Horário (HH:MM)
  const aplicarMascaraHora = (texto: string, setFuncao: (val: string) => void) => {
    let valor = texto.replace(/\D/g, '');
    if (valor.length > 4) valor = valor.slice(0, 4);
    if (valor.length > 2) {
      valor = valor.replace(/(\d{2})(\d{1,2})/, '$1:$2');
    }
    setFuncao(valor);
  };

  const handleSalvarAgenda = async () => {
    if (!especialidadeSelecionada || !medicoSelecionado || !dataAgenda || !horaInicio || !horaFim) {
      Alert.alert("Atenção", "Preencha todos os campos para cadastrar a agenda.");
      return;
    }

    const partesData = dataAgenda.split('/');
    if (partesData.length !== 3 || dataAgenda.length !== 10) {
      Alert.alert("Erro", "Digite a data no formato DD/MM/AAAA.");
      return;
    }
    const dataMySQL = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

    setSalvando(true);

    try {
      const resposta = await fetch(`http://${IP}:3000/agendas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          especialidade_id: especialidadeSelecionada.id,
          medico_id: medicoSelecionado.id_perfil_medico,
          data: dataMySQL,
          hora_inicio: horaInicio,
          hora_fim: horaFim
        })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        Alert.alert("Sucesso", dados.mensagem || "Agenda salva com sucesso!", [
          { 
            text: "OK", 
            onPress: () => {
              router.back();
            } 
          }
        ]);
      } else {
        Alert.alert("Erro", dados.erro || "Não foi possível criar a agenda.");
      }
    } catch (error) {
      Alert.alert("Erro de Conexão", "Falha ao conectar com o servidor.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#12A388" />
          <Text style={styles.headerTitle}>Agendas Médicas</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.cardForm}>
          <Text style={styles.sectionTitle}>Cadastrar Novo Turno</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Especialidade</Text>
            <TouchableOpacity 
              style={styles.dropdownButton} 
              onPress={() => setMostrarDropdownEsp(!mostrarDropdownEsp)}
            >
              <Text style={[styles.dropdownText, !especialidadeSelecionada && styles.placeholderText]}>
                {especialidadeSelecionada ? especialidadeSelecionada.nome : 'Selecione a especialidade'}
              </Text>
              <Ionicons name={mostrarDropdownEsp ? "chevron-up" : "chevron-down"} size={20} color="#718096" />
            </TouchableOpacity>

            {mostrarDropdownEsp && (
              <View style={styles.dropdownOptions}>
                {especialidades.map((esp) => (
                  <TouchableOpacity 
                    key={esp.id} 
                    style={styles.optionItem}
                    onPress={() => {
                      setEspecialidadeSelecionada(esp);
                      setMostrarDropdownEsp(false);
                    }}
                  >
                    <Text style={styles.optionText}>{esp.nome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.inputGroup, !especialidadeSelecionada && { opacity: 0.5 }]}>
            <Text style={styles.label}>Médico</Text>
            <TouchableOpacity 
              style={styles.dropdownButton} 
              disabled={!especialidadeSelecionada}
              onPress={() => setMostrarDropdownMed(!mostrarDropdownMed)}
            >
              <Text style={[styles.dropdownText, !medicoSelecionado && styles.placeholderText]}>
                {medicoSelecionado 
                  ? `Dr(a). ${medicoSelecionado.nome} ${medicoSelecionado.sobrenome}` 
                  : 'Selecione o médico'}
              </Text>
              {carregandoMedicos ? (
                <ActivityIndicator size="small" color="#12A388" />
              ) : (
                <Ionicons name={mostrarDropdownMed ? "chevron-up" : "chevron-down"} size={20} color="#718096" />
              )}
            </TouchableOpacity>

            {mostrarDropdownMed && medicos.length > 0 && (
              <View style={styles.dropdownOptions}>
                {medicos.map((med) => (
                  <TouchableOpacity 
                    key={med.id_perfil_medico} 
                    style={styles.optionItem}
                    onPress={() => {
                      setMedicoSelecionado(med);
                      setMostrarDropdownMed(false);
                    }}
                  >
                    <Text style={styles.optionText}>Dr(a). {med.nome} {med.sobrenome}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {mostrarDropdownMed && medicos.length === 0 && !carregandoMedicos && (
              <View style={styles.dropdownOptions}>
                <Text style={[styles.optionText, { padding: 16, color: '#A0AEC0' }]}>
                  Nenhum médico vinculado a esta especialidade.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data do Atendimento</Text>
            <TextInput 
              style={styles.input} 
              placeholder="DD/MM/AAAA" 
              placeholderTextColor="#A0AEC0" // <-- ADICIONADO AQUI
              value={dataAgenda} 
              onChangeText={aplicarMascaraData}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.horariosRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Hora de Início</Text>
              <TextInput 
                style={styles.input} 
                placeholder="08:00" 
                placeholderTextColor="#A0AEC0" // <-- ADICIONADO AQUI
                value={horaInicio} 
                onChangeText={(t) => aplicarMascaraHora(t, setHoraInicio)}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Hora do Fim</Text>
              <TextInput 
                style={styles.input} 
                placeholder="12:00" 
                placeholderTextColor="#A0AEC0" // <-- ADICIONADO AQUI
                value={horaFim} 
                onChangeText={(t) => aplicarMascaraHora(t, setHoraFim)}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, salvando && { opacity: 0.7 }]} 
            onPress={handleSalvarAgenda}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Cadastrar Horário</Text>
              </>
            )}
          </TouchableOpacity>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 16 : 16, 
    paddingBottom: 16, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0' 
  },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 4 },
  
  container: { padding: 24, paddingBottom: 60 },
  cardForm: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 20 },
  
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#aab3c0', marginBottom: 4, marginLeft: 4 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#494c50', backgroundColor: '#F7FAFC' },
  
  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14 },
  dropdownText: { fontSize: 16, color: '#2D3748' },
  placeholderText: { color: '#A0AEC0' },
  dropdownOptions: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, marginTop: -4 },
  optionItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
  optionText: { fontSize: 16, color: '#4A5568' },

  horariosRow: { flexDirection: 'row', justifyContent: 'space-between' },

  submitButton: { backgroundColor: '#12A388', flexDirection: 'row', borderRadius: 8, paddingVertical: 14, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});