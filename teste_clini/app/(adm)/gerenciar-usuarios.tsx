import React, { useState, useCallback } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router'; // <-- Adicionado useLocalSearchParams
import { Ionicons } from '@expo/vector-icons';

export default function UsuariosAdmScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // <-- Pegando o ID do Adm logado

  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('Todos'); 
  const [usuariosDb, setUsuariosDb] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const IP = '192.168.1.12';

  // Garante que recarrega a lista se você acabou de voltar da tela de Cadastro
  useFocusEffect(
    useCallback(() => {
      const buscarUsuarios = async () => {
        setCarregando(true);
        try {
          const resposta = await fetch(`http://${IP}:3000/usuarios`); 
          
          if (!resposta.ok) throw new Error('Erro na resposta da rede');

          const dados = await resposta.json();
          
          // Descobre qual é o ID em formato de número
          const idAdmin = id ? (Array.isArray(id) ? parseInt(id[0]) : parseInt(id as string)) : null;
          
          // 🔴 A MÁGICA ESTÁ AQUI: Filtra tirando o ADM logado, depois formata as iniciais
          const dadosFormatados = dados
            .filter((user: any) => user.id !== idAdmin)
            .map((user: any) => {
              const nomeSplit = user.nome ? user.nome.split(' ') : ['U', 'N'];
              const iniciais = nomeSplit.length > 1 
                ? `${nomeSplit[0][0]}${nomeSplit[1][0]}`.toUpperCase()
                : user.nome.substring(0, 2).toUpperCase();
                
              return { ...user, iniciais };
            });

          setUsuariosDb(dadosFormatados);
        } catch (error) {
          console.error("Erro ao conectar com a API:", error);
        } finally {
          setCarregando(false);
        }
      };

      buscarUsuarios();
    }, [id])
  );

  const usuariosFiltrados = usuariosDb.filter(user => {
    let matchAba = true;
    if (abaAtiva === 'Pacientes') matchAba = user.tipo === 'Paciente';
    if (abaAtiva === 'Médicos') matchAba = user.tipo === 'Medico';

    const nomeSeguro = user.nome ? user.nome.toLowerCase() : '';
    const emailSeguro = user.email ? user.email.toLowerCase() : '';

    const matchBusca = nomeSeguro.includes(busca.toLowerCase()) || emailSeguro.includes(busca.toLowerCase());
    return matchAba && matchBusca;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#12A388" />
          <Text style={styles.headerTitle}>Usuários</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#12A388" />
          <Text style={styles.loadingText}>Buscando usuários...</Text>
        </View>
      ) : (
        <>
          {/* BOTÃO CADASTRAR NOVO (CIMA) */}
          <View style={styles.actionTopContainer}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => router.push({ pathname: '/cadastro', params: { modoAdm: 'true' } })}
            >
              <Ionicons name="add-circle" size={24} color="#FFF" />
              <Text style={styles.addButtonText}>Cadastrar Novo Usuário</Text>
            </TouchableOpacity>
          </View>

          {/* BARRA DE BUSCA */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color="#A0AEC0" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nome ou e-mail"
                placeholderTextColor="#A0AEC0"
                value={busca}
                onChangeText={setBusca}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* ABAS */}
          <View style={styles.tabsContainer}>
            {['Todos', 'Pacientes', 'Médicos'].map((aba) => (
              <TouchableOpacity 
                key={aba}
                style={[styles.tabButton, abaAtiva === aba && styles.tabButtonActive]}
                onPress={() => setAbaAtiva(aba)}
              >
                <Text style={[styles.tabText, abaAtiva === aba && styles.tabTextActive]}>
                  {aba}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.listContainer}>
            {usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((user) => (
                <TouchableOpacity 
                  key={user.id} 
                  style={styles.userCard} 
                  activeOpacity={0.7} 
                  onPress={() => router.push({ pathname: '/detalhes-usuario', params: { id: user.id } })}
                >
                  <View style={[styles.avatar, user.tipo === 'Paciente' ? styles.bgTealLight : styles.bgPurpleLight]}>
                    <Text style={[styles.avatarText, user.tipo === 'Paciente' ? styles.textTeal : styles.textPurple]}>
                      {user.iniciais}
                    </Text>
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.nome}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>

                  <View style={styles.badgesContainer}>
                    <View style={[styles.badge, user.tipo === 'Paciente' ? styles.bgTealLight : styles.bgPurpleLight]}>
                      <Text style={[styles.badgeText, user.tipo === 'Paciente' ? styles.textTeal : styles.textPurple]}>
                        {user.tipo === 'Medico' ? 'Médico' : user.tipo}
                      </Text>
                    </View>
                    <View style={[styles.badge, user.status === 'Ativo' ? styles.bgGreenLight : styles.bgGrayLight, { marginTop: 4 }]}>
                      <Text style={[styles.badgeText, user.status === 'Ativo' ? styles.textGreen : styles.textGray]}>
                        {user.status}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#CBD5E0" />
                <Text style={styles.emptyStateText}>Nenhum usuário encontrado.</Text>
              </View>
            )}
          </ScrollView>
        </>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight + 16 : 16, paddingBottom: 16, backgroundColor: '#FFF' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 4 },
  
  actionTopContainer: { backgroundColor: '#FFF', paddingHorizontal: 24, paddingVertical: 12 },
  addButton: { backgroundColor: '#12A388', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#A0AEC0', fontSize: 16 },
  searchContainer: { backgroundColor: '#FFF', paddingHorizontal: 24, paddingBottom: 16 },
  searchInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FAFC', borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, height: 48 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#2D3748' },
  tabsContainer: { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginRight: 8, backgroundColor: '#F7FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  tabButtonActive: { backgroundColor: '#12A388', borderColor: '#12A388' },
  tabText: { fontSize: 14, color: '#718096', fontWeight: '600' },
  tabTextActive: { color: '#FFF' },
  listContainer: { padding: 24, paddingBottom: 48 },
  userCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { fontSize: 16, fontWeight: 'bold' },
  userInfo: { flex: 1, paddingRight: 8 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#2D3748', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#718096' },
  badgesContainer: { alignItems: 'flex-end' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  bgTealLight: { backgroundColor: '#E6FFFA' },
  textTeal: { color: '#319795' },
  bgPurpleLight: { backgroundColor: '#F3EBFF' },
  textPurple: { color: '#805AD5' },
  bgGreenLight: { backgroundColor: '#F0FFF4' },
  textGreen: { color: '#38A169' },
  bgGrayLight: { backgroundColor: '#EDF2F7' },
  textGray: { color: '#718096' },
  emptyState: { alignItems: 'center', marginTop: 48 },
  emptyStateText: { marginTop: 12, color: '#A0AEC0', fontSize: 16 },
});