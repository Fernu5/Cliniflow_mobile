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
  ActivityIndicator,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DetalhesConsultaAdmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 

  const [consulta, setConsulta] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarDetalhes = async () => {
      try {
        const resposta = await fetch(`http://192.168.1.12:3000/consulta/${id}`);
        const dados = await resposta.json();
        if (dados && !dados.erro) {
          setConsulta(dados);
        }
      } catch (error) {
        console.error("Erro ao buscar consulta:", error);
      } finally {
        setCarregando(false);
      }
    };

    if (id) buscarDetalhes();
  }, [id]);

  const handleCancelar = () => {
    Alert.alert(
      "Cancelar Consulta",
      "Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.",
      [
        { text: "Voltar", style: "cancel" },
        { 
          text: "Sim, Cancelar", 
          style: "destructive",
          onPress: async () => {
            try {
              await fetch(`http://192.168.1.12:3000/consulta/${id}/cancelar`, { method: 'PATCH' });
              Alert.alert("Sucesso", "Consulta cancelada.");
              router.back();
            } catch (error) {
              Alert.alert("Erro", "Falha ao cancelar consulta.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#12A388" />
          <Text style={styles.headerTitle}>Detalhes do Agendamento</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#12A388" />
        </View>
      ) : consulta ? (
        <ScrollView contentContainerStyle={styles.container}>
          
          {/* STATUS E DATA */}
          <View style={styles.statusHeader}>
            <View style={[
              styles.badge,
              consulta.status === 'Concluida' ? styles.bgTealLight :
              consulta.status === 'Agendada' ? styles.bgOrangeLight :
              styles.bgRedLight
            ]}>
              <Text style={[
                styles.badgeText,
                consulta.status === 'Concluida' ? styles.textTeal :
                consulta.status === 'Agendada' ? styles.textOrange :
                styles.textRed
              ]}>
                {consulta.status}
              </Text>
            </View>
            <Text style={styles.dateTimeText}>{consulta.data}</Text>
            <Text style={styles.hoursText}>{consulta.hora_inicio} às {consulta.hora_fim}</Text>
          </View>

          {/* DADOS DO PACIENTE */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={20} color="#319795" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Paciente</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.infoName}>{consulta.paciente_nome}</Text>
            <Text style={styles.infoSub}>CPF: {consulta.paciente_cpf}</Text>
          </View>

          {/* DADOS DO MÉDICO */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="medkit" size={20} color="#805AD5" style={{ marginRight: 8 }} />
              <Text style={styles.cardTitle}>Médico Responsável</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.infoName}>{consulta.medico_nome}</Text>
            <Text style={styles.infoSub}>Especialidade: {consulta.especialidade}</Text>
          </View>

          {/* BOTÃO DE CANCELAR (SÓ APARECE SE ESTIVER AGENDADA) */}
          {consulta.status === 'Agendada' && (
            <TouchableOpacity style={styles.btnDanger} onPress={handleCancelar}>
              <Ionicons name="close-circle" size={20} color="#E53E3E" style={{ marginRight: 8 }} />
              <Text style={styles.btnDangerText}>Cancelar Agendamento</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#A0AEC0' }}>Erro ao carregar dados.</Text>
        </View>
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
  container: { padding: 24, paddingBottom: 48 },

  statusHeader: { alignItems: 'center', marginBottom: 24 },
  badge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 12 },
  badgeText: { fontSize: 14, fontWeight: 'bold' },
  bgTealLight: { backgroundColor: '#E6FFFA' }, textTeal: { color: '#319795' },
  bgOrangeLight: { backgroundColor: '#FFFAF0' }, textOrange: { color: '#DD6B20' },
  bgRedLight: { backgroundColor: '#FFF5F5' }, textRed: { color: '#E53E3E' },
  
  dateTimeText: { fontSize: 24, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
  hoursText: { fontSize: 16, color: '#718096' },

  infoCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#4A5568' },
  divider: { height: 1, backgroundColor: '#EDF2F7', marginBottom: 12 },
  infoName: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
  infoSub: { fontSize: 14, color: '#718096' },

  btnDanger: { flexDirection: 'row', backgroundColor: '#FFF5F5', padding: 16, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#FEB2B2', marginTop: 16 },
  btnDangerText: { color: '#E53E3E', fontSize: 16, fontWeight: 'bold' }
});