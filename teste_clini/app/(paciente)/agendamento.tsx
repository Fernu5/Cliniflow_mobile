import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Platform, StatusBar 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AgendamentoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 

  const IP = '192.168.1.12';

  const [especialidades, setEspecialidades] = useState<any[]>([]);
  const [medicos, setMedicos] = useState<any[]>([]);
  const [diasDisponiveis, setDiasDisponiveis] = useState<number[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);

  const [especialidadeSelecionada, setEspecialidadeSelecionada] = useState<any>(null);
  const [medicoSelecionado, setMedicoSelecionado] = useState<any>(null);
  const [diaSelecionado, setDiaSelecionado] = useState<number | null>(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState<any>(null);

  const [mostrarEspecialidades, setMostrarEspecialidades] = useState(false);
  const [mostrarMedicos, setMostrarMedicos] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [dataCalendario, setDataCalendario] = useState(new Date());
  const anoCalendario = dataCalendario.getFullYear();
  const mesCalendario = dataCalendario.getMonth(); 
  const nomeMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const voltarMes = () => {
    setDataCalendario(new Date(anoCalendario, mesCalendario - 1, 1));
  };
  const avancarMes = () => {
    setDataCalendario(new Date(anoCalendario, mesCalendario + 1, 1));
  };

  const diasDoMes = useMemo(() => {
    const primeiroDiaDaSemana = new Date(anoCalendario, mesCalendario, 1).getDay();
    const totalDiasNoMes = new Date(anoCalendario, mesCalendario + 1, 0).getDate();
    
    const dias = [];
    
    for (let i = 0; i < primeiroDiaDaSemana; i++) {
      dias.push({ vazio: true, id: `empty-${i}` });
    }
    
    for (let d = 1; d <= totalDiasNoMes; d++) {
      dias.push({ vazio: false, dia: d });
    }
    return dias;
  }, [dataCalendario]);

  useEffect(() => {
    fetch(`http://${IP}:3000/especialidades`)
      .then(res => res.json())
      .then(dados => setEspecialidades(dados))
      .catch(() => console.log("Erro ao carregar especialidades"));
  }, []);

  useEffect(() => {
    if (especialidadeSelecionada) {
      setCarregando(true);
      fetch(`http://${IP}:3000/especialidades/${especialidadeSelecionada.id}/medicos`)
        .then(res => res.json())
        .then(dados => setMedicos(dados))
        .catch(() => console.log("Erro ao carregar médicos"))
        .finally(() => setCarregando(false));
    }
  }, [especialidadeSelecionada]);

  useEffect(() => {
    if (medicoSelecionado) {
      setDiaSelecionado(null);
      setHorarioSelecionado(null);
      setHorarios([]);

      const ano = dataCalendario.getFullYear();
      const mes = dataCalendario.getMonth() + 1;

      fetch(`http://${IP}:3000/medico/${medicoSelecionado.id_perfil_medico}/agenda/dias?ano=${ano}&mes=${mes}`)
        .then(res => res.json())
        .then(dados => setDiasDisponiveis(dados)) 
        .catch(() => console.log("Erro ao carregar dias"));
    }
  }, [medicoSelecionado, dataCalendario]);

  useEffect(() => {
    if (diaSelecionado && medicoSelecionado) {
      const dataFormatada = `${anoCalendario}-${String(mesCalendario + 1).padStart(2, '0')}-${String(diaSelecionado).padStart(2, '0')}`;
      
      setCarregando(true);
      fetch(`http://${IP}:3000/medico/${medicoSelecionado.id_perfil_medico}/agenda/horarios?data=${dataFormatada}`)
        .then(res => res.json())
        .then(dados => setHorarios(dados))
        .catch(() => console.log("Erro ao carregar horários"))
        .finally(() => setCarregando(false));
    }
  }, [diaSelecionado]);

  const handleAgendar = async () => {
    if (!horarioSelecionado || !diaSelecionado || !medicoSelecionado) return;

    setCarregando(true);

    const dataFormatada = `${anoCalendario}-${String(mesCalendario + 1).padStart(2, '0')}-${String(diaSelecionado).padStart(2, '0')}`;
    const idLimpo = Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string);

    try {
      const resposta = await fetch(`http://${IP}:3000/agendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paciente_id: idLimpo,
          medico_id: medicoSelecionado.id_perfil_medico,
          data: dataFormatada,
          hora_inicio: horarioSelecionado.hora,
          status_horario: horarioSelecionado.status
        })
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        Alert.alert(
          "Sucesso", 
          horarioSelecionado.status === 'livre' ? "Consulta agendada." : "Esperando na lista.", 
          [
            { text: "OK", onPress: () => router.back() }
          ]
        );
      } else {
        Alert.alert("Erro", dados.erro || "Não foi possível concluir o agendamento.");
      }
    } catch (error) {
      Alert.alert("Erro de Conexão", "Falha ao conectar com o servidor.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#2D3748" />
          <Text style={styles.headerTitle}>Agendar consulta</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={24} color="#2D3748" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Especialidade</Text>
          <TouchableOpacity 
            style={styles.dropdownButton} 
            onPress={() => setMostrarEspecialidades(!mostrarEspecialidades)}
          >
            <Text style={[styles.dropdownText, !especialidadeSelecionada && styles.placeholderText]}>
              {especialidadeSelecionada ? especialidadeSelecionada.nome : 'Selecione a especialidade'}
            </Text>
            <Ionicons name={mostrarEspecialidades ? "chevron-up" : "chevron-down"} size={20} color="#718096" />
          </TouchableOpacity>
          
          {mostrarEspecialidades && (
            <View style={styles.dropdownOptions}>
              {especialidades.map((esp) => (
                <TouchableOpacity 
                  key={esp.id} 
                  style={styles.optionItem}
                  onPress={() => {
                    setEspecialidadeSelecionada(esp);
                    setMostrarEspecialidades(false);
                    setMedicoSelecionado(null);
                    setDiaSelecionado(null);
                    setHorarioSelecionado(null);
                    setMedicos([]); 
                  }}
                >
                  <Text style={styles.optionText}>{esp.nome}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={[styles.fieldContainer, !especialidadeSelecionada && styles.disabledField]}>
          <Text style={styles.fieldLabel}>Médico</Text>
          <TouchableOpacity 
            style={styles.dropdownButton} 
            disabled={!especialidadeSelecionada}
            onPress={() => setMostrarMedicos(!mostrarMedicos)}
          >
            <Text style={[styles.dropdownText, !medicoSelecionado && styles.placeholderText]}>
              {medicoSelecionado ? `Dr(a). ${medicoSelecionado.nome} ${medicoSelecionado.sobrenome}` : 'Selecione o médico'}
            </Text>
            {carregando && !medicoSelecionado ? <ActivityIndicator size="small" color="#12A388" /> : <Ionicons name={mostrarMedicos ? "chevron-up" : "chevron-down"} size={20} color="#718096" />}
          </TouchableOpacity>

          {mostrarMedicos && medicos.length > 0 && (
            <View style={styles.dropdownOptions}>
              {medicos.map((med) => (
                <TouchableOpacity 
                  key={med.id_perfil_medico} 
                  style={styles.optionItem}
                  onPress={() => {
                    setMedicoSelecionado(med);
                    setMostrarMedicos(false);
                    setDiaSelecionado(null);
                    setHorarioSelecionado(null);
                    setHorarios([]);
                  }}
                >
                  <Text style={styles.optionText}>Dr(a). {med.nome} {med.sobrenome}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {mostrarMedicos && medicos.length === 0 && !carregando && (
            <View style={styles.dropdownOptions}>
              <Text style={[styles.optionText, {padding: 16, color: '#A0AEC0'}]}>Nenhum médico encontrado.</Text>
            </View>
          )}
        </View>

        {medicoSelecionado && (
          <View style={styles.calendarSection}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={voltarMes} style={{padding: 4}}>
                <Ionicons name="chevron-back" size={24} color="#2D3748" />
              </TouchableOpacity>
              
              <Text style={styles.monthTitle}>{nomeMeses[mesCalendario]} {anoCalendario}</Text>
              
              <TouchableOpacity onPress={avancarMes} style={{padding: 4}}>
                <Ionicons name="chevron-forward" size={24} color="#2D3748" />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((dia, i) => (
                <View key={`week-${i}`} style={styles.weekDayWrapper}>
                  <Text style={styles.weekDayText}>{dia}</Text>
                </View>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {diasDoMes.map((item, index) => {
                if (item.vazio) {
                  return <View key={item.id} style={styles.dayWrapper} />;
                }
                
                const diaAtual = item.dia;          
                const isLivre = diasDisponiveis.includes(diaAtual);
                
                return (
                  <View key={`day-${diaAtual}`} style={styles.dayWrapper}>
                    <TouchableOpacity 
                      disabled={!isLivre} 
                      style={[
                        styles.dayButton,
                        isLivre && styles.dayButtonLivre,
                        diaSelecionado === diaAtual && styles.dayButtonSelecionado
                      ]}
                      onPress={() => {
                        setDiaSelecionado(diaAtual);
                        setHorarioSelecionado(null);
                      }}
                    >
                      <Text style={[
                        styles.dayText,
                        !isLivre && styles.dayTextInativo,
                        isLivre && styles.dayTextBranco,
                        diaSelecionado === diaAtual && styles.dayTextSelecionado
                      ]}>
                        {diaAtual}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#12A388'}]} />
                <Text style={styles.legendText}>Disponível</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, {backgroundColor: '#FEB2B2'}]} />
                <Text style={styles.legendText}>Ocupado</Text>
              </View>
            </View>
          </View>
        )}

        {diaSelecionado && (
          <View style={styles.horariosSection}>
            <Text style={styles.horariosTitle}>Horários — Dia {diaSelecionado}</Text>
            
            {carregando ? (
              <ActivityIndicator size="large" color="#12A388" />
            ) : horarios.length > 0 ? (
              <View style={styles.horariosGrid}>
                {horarios.map((item, index) => {
                  const isSelecionado = horarioSelecionado?.hora === item.hora;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.horarioButton,
                        item.status === 'livre' ? styles.horarioLivre : styles.horarioOcupado,
                        isSelecionado && item.status === 'livre' && styles.horarioSelecionadoAtivo,
                        isSelecionado && item.status === 'ocupado' && styles.horarioSelecionadoOcupado
                      ]}
                      onPress={() => setHorarioSelecionado(item)}
                    >
                      <Text style={[
                        styles.horarioText,
                        item.status === 'ocupado' && !isSelecionado && styles.horarioTextOcupado,
                        isSelecionado && styles.horarioTextSelecionadoBranco
                      ]}>
                        {item.hora}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
               <Text style={{textAlign: 'center', color: '#A0AEC0', marginTop: 10}}>
                 Nenhum horário cadastrado para este dia.
               </Text>
            )}
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            !horarioSelecionado && styles.submitButtonDisabled,
            horarioSelecionado?.status === 'ocupado' && styles.submitButtonListaEspera
          ]}
          disabled={!horarioSelecionado}
          onPress={handleAgendar}
        >
          <Text style={styles.submitButtonText}>
            {!horarioSelecionado 
              ? 'Selecione um horário' 
              : horarioSelecionado.status === 'ocupado' 
                ? 'Entrar na Lista de Espera' 
                : 'Agendar Consulta'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16, 
    paddingBottom: 16, 
    backgroundColor: '#FFF', 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0' 
  },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 4 },
  bellButton: { padding: 4 },
  container: { padding: 24, paddingBottom: 100 }, 
  fieldContainer: { marginBottom: 20 },
  disabledField: { opacity: 0.5 },
  fieldLabel: { fontSize: 14, color: '#718096', marginBottom: 8, marginLeft: 4 },
  dropdownButton: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14 },
  dropdownText: { fontSize: 16, color: '#2D3748' },
  placeholderText: { color: '#A0AEC0' },
  dropdownOptions: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderTopWidth: 0, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, marginTop: -4 },
  optionItem: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F7FAFC' },
  optionText: { fontSize: 16, color: '#4A5568' },
  calendarSection: { marginTop: 16, backgroundColor: '#FFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  monthTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3748' },
  
  weekDaysRow: { flexDirection: 'row', marginBottom: 8 },
  weekDayWrapper: { width: '14.28%', alignItems: 'center' },
  weekDayText: { fontSize: 12, color: '#A0AEC0', fontWeight: 'bold' },
  
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayWrapper: { width: '14.28%', alignItems: 'center', marginBottom: 8 },
  dayButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
  
  dayButtonLivre: { backgroundColor: '#12A388' },
  dayButtonOcupado: { backgroundColor: '#FEB2B2' },
  dayButtonSelecionado: { backgroundColor: '#FFF', borderWidth: 2, borderColor: '#12A388' }, 
  dayText: { fontSize: 14, color: '#4A5568' },
  dayTextInativo: { color: '#CBD5E0' },
  dayTextBranco: { color: '#FFF', fontWeight: 'bold' },
  dayTextVermelhoEscuro: { color: '#C53030', fontWeight: 'bold' },
  dayTextSelecionado: { color: '#12A388', fontWeight: 'bold' },
  legendContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16, gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#718096' },
  horariosSection: { marginTop: 24 },
  horariosTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D3748', marginBottom: 16, textAlign: 'center' },
  horariosGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  horarioButton: { width: '31%', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginBottom: 12, borderWidth: 1 },
  horarioLivre: { backgroundColor: '#E6FFFA', borderColor: '#12A388' },
  horarioOcupado: { backgroundColor: '#FED7D7', borderColor: '#FEB2B2' },
  horarioSelecionadoAtivo: { backgroundColor: '#12A388', borderColor: '#12A388' },
  horarioSelecionadoOcupado: { backgroundColor: '#DD6B20', borderColor: '#DD6B20' },
  horarioText: { fontSize: 14, fontWeight: 'bold', color: '#12A388' },
  horarioTextOcupado: { color: '#E53E3E' },
  horarioTextSelecionadoBranco: { color: '#FFF' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', padding: 24, borderTopWidth: 1, borderTopColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 5 },
  submitButton: { backgroundColor: '#12A388', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonListaEspera: { backgroundColor: '#DD6B20' },
  submitButtonDisabled: { backgroundColor: '#CBD5E0' },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});