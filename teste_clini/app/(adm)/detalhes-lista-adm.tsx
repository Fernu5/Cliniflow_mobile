import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router'; 
import { Ionicons } from '@expo/vector-icons';

export default function DetalhesFilaAdmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // 🔴 COLOQUE SEU IP AQUI
  const IP = '192.168.1.12';

  const [filaInfo, setFilaInfo] = useState<any>(null);
  const [pacientesFila, setPacientesFila] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarDetalhesFila = async () => {
      try {
        const resposta = await fetch(`http://${IP}:3000/fila/${id}`);
        const dados = await resposta.json();
        
        setFilaInfo(dados.info);
        setPacientesFila(dados.pacientes || []);
      } catch (error) {
        console.error("Erro ao buscar detalhes da fila:", error);
      } finally {
        setCarregando(false);
      }
    };

    if (id) {
      buscarDetalhesFila();
    }
  }, [id]);

  const handleAlocarVaga = (paciente: any) => {
    Alert.alert(
      "Alocar Vaga Manualmente",
      `Deseja transformar a posição de ${paciente.nome} em uma consulta confirmada para as ${filaInfo?.hora}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Confirmar", 
          onPress: () => {
            setPacientesFila(prev => prev.filter(p => p.id !== paciente.id));
            Alert.alert("Sucesso", "Consulta agendada com sucesso!");
          }
        }
      ]
    );
  };

  const handleRemoverPaciente = (nome: string, idPaciente: string) => {
    Alert.alert(
      "Remover da Fila",
      `O paciente ${nome} desistiu da vaga?`,
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim, Remover", 
          style: "destructive",
          onPress: async () => {
            try {
              // Conecta com o backend para remover o paciente de verdade
              const resposta = await fetch(`http://${IP}:3000/listas-espera/paciente/${idPaciente}/remover`, {
                method: 'PATCH'
              });

              if (resposta.ok) {
                // Tira o paciente da tela
                setPacientesFila(prev => prev.filter(p => p.id !== idPaciente));
                
                // LÓGICA DE OURO: Se a fila só tinha 1 paciente, ela agora está vazia!
                if (pacientesFila.length === 1) {
                  Alert.alert(
                    "Fila Encerrada", 
                    "Este era o último paciente. A lista de espera foi encerrada.",
                    [{ text: "OK", onPress: () => router.back() }] // Volta automaticamente
                  );
                }
              } else {
                Alert.alert("Erro", "Não foi possível remover o paciente do banco de dados.");
              }
            } catch (error) {
              Alert.alert("Erro de conexão", "Falha ao se comunicar com o servidor.");
            }
          }
        }
      ]
    );
  };

  const handleNotificarApp = (nome: string) => {
    Alert.alert(
      "Notificação Push",
      `Enviar um alerta no aplicativo para ${nome} informando que a vez está próxima?`,
      [{ text: "Cancelar", style: "cancel" }, { text: "Sim, Enviar" }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#12A388" />
          <Text style={styles.headerTitle}>Gerenciar Fila</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#12A388" />
          <Text style={styles.loadingText}>Carregando informações da fila...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          
          {filaInfo && (
            <View style={styles.targetInfoCard}>
              <View style={styles.targetHeader}>
                <Ionicons name="medkit" size={20} color="#805AD5" style={{ marginRight: 8 }} />
                <Text style={styles.targetTitle}>Fila de Espera para:</Text>
              </View>
              <Text style={styles.targetMedico}>{filaInfo.medico}</Text>
              <Text style={styles.targetDetails}>{filaInfo.especialidade}</Text>
              
              <View style={styles.dateTimeBadge}>
                <Ionicons name="calendar" size={16} color="#2D3748" style={{ marginRight: 6 }} />
                <Text style={styles.dateTimeText}>{filaInfo.data} às {filaInfo.hora}</Text>
              </View>
            </View>
          )}

          <View style={styles.listHeaderRow}>
            <Text style={styles.sectionTitle}>Ordem de Chamada</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{pacientesFila.length} aguardando</Text>
            </View>
          </View>

          {pacientesFila.length > 0 ? (
            pacientesFila.map((paciente, index) => {
              const isFirst = index === 0;
              
              return (
                <View key={paciente.id} style={[styles.patientCard, isFirst && styles.patientCardFirst]}>
                  <View style={styles.cardMain}>
                    <View style={[styles.positionBadge, isFirst ? styles.posBadgeFirst : styles.posBadgeRegular]}>
                      <Text style={[styles.positionText, isFirst && styles.posTextFirst]}>
                        {index + 1}º
                      </Text>
                    </View>

                    <View style={styles.patientData}>
                      {isFirst && <Text style={styles.nextInLineText}>PRÓXIMO DA FILA</Text>}
                      <Text style={styles.patientName}>{paciente.nome}</Text>
                      
                      <View style={styles.contactRow}>
                        <Ionicons name="mail" size={14} color="#4A5568" style={{ marginRight: 6 }} />
                        <Text style={styles.patientEmail}>{paciente.email}</Text>
                      </View>

                      <TouchableOpacity style={styles.notifyButton} onPress={() => handleNotificarApp(paciente.nome)}>
                        <Ionicons name="notifications" size={14} color="#319795" style={{ marginRight: 6 }} />
                        <Text style={styles.notifyButtonText}>Avisar no App</Text>
                      </TouchableOpacity>
                      
                      <Text style={styles.entryTimeText}>Entrou na fila: {paciente.entrada}</Text>
                    </View>
                  </View>

                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.btnRemove} onPress={() => handleRemoverPaciente(paciente.nome, paciente.id)}>
                      <Ionicons name="trash-outline" size={18} color="#E53E3E" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.btnAllocate, isFirst ? styles.btnAllocatePrimary : styles.btnAllocateSecondary]} onPress={() => handleAlocarVaga(paciente)}>
                      <Ionicons name="checkmark-circle" size={18} color={isFirst ? "#FFF" : "#12A388"} style={{ marginRight: 6 }} />
                      <Text style={isFirst ? styles.txtAllocatePrimary : styles.txtAllocateSecondary}>
                        Alocar Vaga
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="happy-outline" size={64} color="#CBD5E0" />
              <Text style={styles.emptyStateText}>Fila vazia!</Text>
              <Text style={styles.emptyStateSub}>Não há pacientes aguardando este horário.</Text>
            </View>
          )}

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 16 : 16, paddingBottom: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 4 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#A0AEC0', fontSize: 16 },

  container: { padding: 24, paddingBottom: 48 },

  targetInfoCard: { backgroundColor: '#F3EBFF', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#D6BCFA', marginBottom: 24 },
  targetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  targetTitle: { fontSize: 14, color: '#6B46C1', fontWeight: 'bold' },
  targetMedico: { fontSize: 22, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
  targetDetails: { fontSize: 16, color: '#4A5568', marginBottom: 16 },
  
  dateTimeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  dateTimeText: { fontSize: 14, fontWeight: 'bold', color: '#2D3748' },

  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748' },
  countBadge: { backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 12, fontWeight: 'bold', color: '#4A5568' },

  patientCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  patientCardFirst: { borderColor: '#12A388', borderWidth: 2 },
  cardMain: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }, 
  positionBadge: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16, marginTop: 8 }, 
  posBadgeRegular: { backgroundColor: '#EDF2F7' },
  posBadgeFirst: { backgroundColor: '#E6FFFA' },
  positionText: { fontSize: 20, fontWeight: 'bold', color: '#718096' },
  posTextFirst: { color: '#319795', fontSize: 24 },

  patientData: { flex: 1 },
  nextInLineText: { fontSize: 10, fontWeight: 'bold', color: '#319795', letterSpacing: 0.5, marginBottom: 2 },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 6 },
  contactRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  patientEmail: { fontSize: 14, color: '#4A5568' },
  notifyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E6FFFA', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginBottom: 10 },
  notifyButtonText: { color: '#319795', fontSize: 12, fontWeight: 'bold' },
  entryTimeText: { fontSize: 12, color: '#A0AEC0' },

  actionButtonsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F7FAFC', paddingTop: 16 },
  btnRemove: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12, borderWidth: 1, borderColor: '#FEB2B2' },
  btnAllocate: { flex: 1, flexDirection: 'row', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  btnAllocatePrimary: { backgroundColor: '#12A388', borderColor: '#12A388' },
  btnAllocateSecondary: { backgroundColor: '#F7FAFC', borderColor: '#12A388' },
  txtAllocatePrimary: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  txtAllocateSecondary: { color: '#12A388', fontSize: 14, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 48, padding: 24 },
  emptyStateText: { marginTop: 16, color: '#4A5568', fontSize: 20, fontWeight: 'bold' },
  emptyStateSub: { marginTop: 8, color: '#A0AEC0', fontSize: 14, textAlign: 'center' },
});