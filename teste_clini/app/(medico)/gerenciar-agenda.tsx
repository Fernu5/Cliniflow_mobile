import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, Alert, ActivityIndicator, Platform, StatusBar as RNStatusBar
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function GerenciarAgendaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 
  
  const IP = '192.168.1.12';

  const [diasDisponiveis, setDiasDisponiveis] = useState([]);
  const [diaSelecionado, setDiaSelecionado] = useState(null); 
  const [agendaDoDia, setAgendaDoDia] = useState([]);
  const [carregandoDias, setCarregandoDias] = useState(true);
  const [carregandoAgenda, setCarregandoAgenda] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const buscarDias = async () => {
        if (!id) return;
        setCarregandoDias(true);
        try {
          const idLimpo = Array.isArray(id) ? id[0] : id;
          const resposta = await fetch(`http://${IP}:3000/api/agenda-medico/${idLimpo}/semana`);
          const dados = await resposta.json();
          
          if (dados && dados.length > 0) {
            setDiasDisponiveis(dados);
            if (!diaSelecionado) {
              setDiaSelecionado(dados[0].data_completa);
            }
          }
        } catch (error) {
          console.error("Erro ao buscar dias:", error);
        } finally {
          setCarregandoDias(false);
        }
      };
      buscarDias();
    }, [id])
  );

  useEffect(() => {
    const buscarAgenda = async () => {
      if (!id || !diaSelecionado) return;
      setCarregandoAgenda(true);
      try {
        const idLimpo = Array.isArray(id) ? id[0] : id;
        const resposta = await fetch(`http://${IP}:3000/api/agenda-medico/${idLimpo}/dia?data=${diaSelecionado}`);
        const dados = await resposta.json();
        setAgendaDoDia(dados);
      } catch (error) {
        console.error("Erro ao carregar agenda do dia:", error);
      } finally {
        setCarregandoAgenda(false);
      }
    };
    buscarAgenda();
  }, [id, diaSelecionado]);

  const handleAtender = (consultaId, nomePaciente) => {
    Alert.alert(
      "Concluir Atendimento", 
      `Deseja marcar a consulta de ${nomePaciente} como concluída?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, Concluir", 
          onPress: async () => {
            try {
              const res = await fetch(`http://${IP}:3000/consulta/${consultaId}/concluir`, { method: 'PATCH' });
              if (res.ok) {
                setAgendaDoDia(prev => prev.map(item => 
                  item.id === consultaId ? { ...item, status: 'Atendido' } : item
                ));
                Alert.alert("Sucesso", "Atendimento concluído com sucesso!");
              } else {
                Alert.alert("Erro", "Não foi possível atualizar no banco de dados.");
              }
            } catch (err) {
              Alert.alert("Erro", "Falha ao concluir atendimento.");
            }
          } 
        }
      ]
    );
  };

  const handleRegistrarFalta = (consultaId, nomePaciente) => {
    Alert.alert(
      "Registrar Falta",
      `Confirmar a ausência de ${nomePaciente}? \n\nO status no banco de dados será alterado para 'Faltou'. Esta ação não pode ser desfeita.`,
      [
        { text: "Voltar", style: "cancel" },
        { 
          text: "Confirmar Falta", 
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`http://${IP}:3000/consulta/${consultaId}/falta`, { method: 'PATCH' });
              if (res.ok) {
                setAgendaDoDia(prev => prev.map(item => 
                  item.id === consultaId ? { ...item, status: 'Faltou' } : item
                ));
                Alert.alert("Sucesso", "Falta registrada no sistema.");
              } else {
                Alert.alert("Erro no Banco", "Verifique se a tabela 'consultas' aceita 'Faltou' no ENUM.");
              }
            } catch (err) {
              Alert.alert("Erro", "Falha de conexão com o servidor.");
            }
          }
        }
      ]
    );
  };

  const diaSubtitulo = diasDisponiveis.find(d => d.data_completa === diaSelecionado);

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* CABEÇALHO RESTAURADO COM O ROUTER.BACK() */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#12A388" />
          <Text style={styles.headerTitle}>Agenda de Atendimento</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dateSelectorContainer}>
        {carregandoDias ? (
          <ActivityIndicator size="small" color="#12A388" style={{ padding: 20 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
            {diasDisponiveis.map((item) => (
              <TouchableOpacity 
                key={item.data_completa} 
                style={[styles.dateBox, diaSelecionado === item.data_completa && styles.dateBoxActive]}
                onPress={() => setDiaSelecionado(item.data_completa)}
              >
                <Text style={[styles.dateWeek, diaSelecionado === item.data_completa && styles.dateTextActive]}>{item.semana}</Text>
                <Text style={[styles.dateDay, diaSelecionado === item.data_completa && styles.dateTextActive]}>{item.dia}</Text>
              </TouchableOpacity>
            ))}
            {diasDisponiveis.length === 0 && (
              <Text style={{ padding: 16, color: '#718096' }}>Nenhuma agenda futura encontrada.</Text>
            )}
          </ScrollView>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.agendaContainer}>
        {diaSubtitulo && (
          <Text style={styles.agendaSubtitle}>Programação para o dia {diaSubtitulo.dia}/{diaSubtitulo.mes}</Text>
        )}
        
        {carregandoAgenda ? (
          <ActivityIndicator size="large" color="#12A388" style={{ marginTop: 40 }} />
        ) : (
          agendaDoDia.map((item, index) => (
            <View key={item.id} style={styles.timelineRow}>
              
              <View style={styles.timeColumn}>
                <Text style={styles.timeText}>{item.hora}</Text>
                {index !== agendaDoDia.length - 1 && <View style={styles.timeLineConnector} />}
              </View>

              <View style={[
                styles.agendaCard, 
                item.status === 'Livre' && styles.agendaCardLivre,
                item.status === 'Atendido' && styles.agendaCardConcluido,
                item.status === 'Faltou' && { backgroundColor: '#FFF5F5', borderColor: '#FED7D7' }
              ]}>
                
                <View style={styles.cardInfo}>
                  <Text style={[
                    styles.pacienteNome, 
                    item.status === 'Livre' && styles.livreText,
                    item.status === 'Atendido' && styles.concluidoText,
                    item.status === 'Faltou' && { color: '#C53030' }
                  ]}>
                    {item.paciente}
                  </Text>
                  
                  {item.status !== 'Livre' && (
                    <Text style={[styles.tipoConsultaText, item.status === 'Atendido' && styles.concluidoText]}>
                      {item.tipo}
                    </Text>
                  )}
                </View>

                {item.status === 'Aguardando' && (
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity style={styles.btnFalta} onPress={() => handleRegistrarFalta(item.id, item.paciente)}>
                      <Text style={styles.btnFaltaText}>Falta</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.btnAtender} onPress={() => handleAtender(item.id, item.paciente)}>
                      <Text style={styles.btnAtenderText}>Atender</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === 'Atendido' && (
                  <View style={styles.badgeAtendido}>
                    <Ionicons name="checkmark-done" size={16} color="#38B2AC" style={{marginRight: 4}} />
                    <Text style={styles.badgeAtendidoText}>Atendido</Text>
                  </View>
                )}

                {item.status === 'Faltou' && (
                  <View style={[styles.badgeAtendido, { backgroundColor: '#FED7D7' }]}>
                    <Ionicons name="close-circle" size={16} color="#E53E3E" style={{marginRight: 4}} />
                    <Text style={[styles.badgeAtendidoText, { color: '#E53E3E' }]}>Faltou</Text>
                  </View>
                )}

                {item.status === 'Livre' && (
                  <View style={styles.badgeLivre}>
                    <Text style={styles.badgeLivreText}>Disponível</Text>
                  </View>
                )}

              </View>
            </View>
          ))
        )}
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
  
  dateSelectorContainer: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingVertical: 12 },
  dateScroll: { paddingHorizontal: 16 },
  dateBox: { width: 56, height: 72, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginHorizontal: 6, backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  dateBoxActive: { backgroundColor: '#12A388', borderColor: '#12A388' },
  dateWeek: { fontSize: 12, color: '#A0AEC0', marginBottom: 4, fontWeight: '500' },
  dateDay: { fontSize: 20, color: '#2D3748', fontWeight: 'bold' },
  dateTextActive: { color: '#FFF' },

  agendaContainer: { padding: 24, paddingBottom: 64 },
  agendaSubtitle: { fontSize: 16, fontWeight: 'bold', color: '#718096', marginBottom: 24 },
  
  timelineRow: { flexDirection: 'row', marginBottom: 16, minHeight: 80 },
  
  timeColumn: { width: 60, alignItems: 'center', marginRight: 16 },
  timeText: { fontSize: 14, fontWeight: 'bold', color: '#2D3748', marginBottom: 8 },
  timeLineConnector: { flex: 1, width: 2, backgroundColor: '#E2E8F0', borderRadius: 1 },
  
  agendaCard: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16, backgroundColor: '#FFF', borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, flexDirection: 'column', justifyContent: 'center' },
  agendaCardLivre: { backgroundColor: '#F7FAFC', borderColor: '#EDF2F7', borderStyle: 'dashed', flexDirection: 'row', alignItems: 'center' },
  agendaCardConcluido: { backgroundColor: '#F0FFF4', borderColor: '#C6F6D5', elevation: 0 },
  
  cardInfo: { flex: 1, marginBottom: 8 },
  pacienteNome: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
  livreText: { color: '#A0AEC0', marginBottom: 0 },
  concluidoText: { color: '#718096' },
  tipoConsultaText: { fontSize: 13, color: '#718096' },
  
  actionButtonsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 },
  
  btnFalta: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#FEB2B2', marginRight: 12 },
  btnFaltaText: { color: '#E53E3E', fontSize: 12, fontWeight: 'bold' },
  
  btnAtender: { backgroundColor: '#12A388', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  btnAtenderText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
  
  badgeLivre: { backgroundColor: '#E6FFFA', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  badgeLivreText: { color: '#38B2AC', fontSize: 12, fontWeight: 'bold' },

  badgeAtendido: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#E6FFFA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  badgeAtendidoText: { color: '#38B2AC', fontSize: 12, fontWeight: 'bold' }
});