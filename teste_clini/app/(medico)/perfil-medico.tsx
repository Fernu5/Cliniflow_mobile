import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView, 
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PerfilMedicoScreen() {
  const router = useRouter();

  const [nome, setNome] = useState('Manuel');
  const [sobrenome, setSobrenome] = useState('Gomes');
  const [email, setEmail] = useState('manuel@email.com');

  const crm = 'CRM/BA 12345';
  const dataNascimento = '10/05/1980';
  const cpf = '123.456.789-00';
  const sexo = 'M';

  const handleSalvar = () => {
    console.log("Salvando alterações do médico...", { nome, sobrenome, email });
    Alert.alert("Sucesso", "Seus dados foram atualizados com sucesso!");
    router.push('/home-medico');
  };

  const handleExcluirConta = () => {
    Alert.alert(
      "Atenção: Solicitação de Exclusão",
      "Como médico cadastrado, a exclusão da sua conta requer validação do Administrador para garantir a integridade dos históricos clínicos. Deseja enviar a solicitação?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sim, solicitar", 
          style: "destructive",
          onPress: () => {
            console.log("Enviando solicitação de exclusão para o ADM...");
            Alert.alert("Enviado", "Sua solicitação foi enviada à administração.");
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/home-medico')}>
          <Ionicons name="chevron-back" size={28} color="#12A388" />
          <Text style={styles.headerTitle}>Editar Perfil (Médico)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.avatarWrapper}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>MG</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editBadge}>
            <Ionicons name="pencil" size={14} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sobrenome</Text>
            <TextInput style={styles.input} value={sobrenome} onChangeText={setSobrenome} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CRM</Text>
            <TextInput 
              style={[styles.input, styles.inputDisabled]} 
              value={crm} 
              editable={false} 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data de Nascimento</Text>
            <TextInput 
              style={[styles.input, styles.inputDisabled]} 
              value={dataNascimento} 
              editable={false} 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>CPF</Text>
            <TextInput 
              style={[styles.input, styles.inputDisabled]} 
              value={cpf} 
              editable={false} 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.sexoContainer}>
            <Text style={styles.sexoLabel}>Sexo</Text>
            
            <View style={styles.radioOption}>
              <View style={[styles.radioOuter, sexo === 'M' ? styles.radioOuterSelectedDisabled : styles.radioOuterDisabled]}>
                {sexo === 'M' && <View style={styles.radioInnerDisabled} />}
              </View>
              <Text style={styles.radioTextDisabled}>M</Text>
            </View>

            <View style={styles.radioOption}>
              <View style={[styles.radioOuter, sexo === 'F' ? styles.radioOuterSelectedDisabled : styles.radioOuterDisabled]}>
                {sexo === 'F' && <View style={styles.radioInnerDisabled} />}
              </View>
              <Text style={styles.radioTextDisabled}>F</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSalvar}>
            <Text style={styles.submitButtonText}>Salvar Alterações</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleExcluirConta}>
            <Text style={styles.deleteButtonText}>Solicitar Exclusão de Conta</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 24, 
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16, 
    paddingBottom: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E2E8F0' },
  backButton: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#2D3748', marginLeft: 4 },
  
  scrollContent: { paddingHorizontal: 32, paddingTop: 32, paddingBottom: 48 },
  
  avatarWrapper: { alignSelf: 'center', marginBottom: 32, position: 'relative' },
  avatarRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#12A388', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: '#E6FFFA', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#12A388', fontSize: 32, fontWeight: 'bold' },
  editBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#12A388', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  
  formContainer: { width: '100%' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, color: '#A0AEC0', marginBottom: 4, marginLeft: 4 },
  
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#2D3748' },
  inputDisabled: { backgroundColor: '#F7FAFC', color: '#A0AEC0', borderColor: '#EDF2F7' },
  
  sexoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, marginTop: 8 },
  sexoLabel: { fontSize: 16, color: '#718096', marginRight: 16 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  radioOuter: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  
  radioOuterDisabled: { borderColor: '#E2E8F0', backgroundColor: '#F7FAFC' },
  radioOuterSelectedDisabled: { borderColor: '#A0AEC0', backgroundColor: '#F7FAFC' },
  radioInnerDisabled: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#A0AEC0' },
  radioTextDisabled: { fontSize: 16, color: '#A0AEC0' },

  submitButton: { backgroundColor: '#12A388', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  
  deleteButton: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FC8181', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  deleteButtonText: { color: '#E53E3E', fontSize: 16, fontWeight: 'bold' },
});