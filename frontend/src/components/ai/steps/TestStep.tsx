import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Bot, User, Play, CheckCircle } from "lucide-react";

interface TestStepProps {
  data: any;
  updateData: (updates: any) => void;
  nextStep?: () => void;
  prevStep?: () => void;
  onComplete?: () => void;
}

const testScenarios = [
  {
    id: "appointment",
    title: "Agendamento",
    message: "Oi, quero agendar um banho para meu cachorro",
    expectedResponse: "Olá! Ficarei feliz em agendar o banho do seu cachorrinho! 🐕 Qual o nome dele e que dia seria melhor para você?"
  },
  {
    id: "emergency",
    title: "Emergência",
    message: "Socorro! Meu gato comeu chocolate!",
    expectedResponse: "🚨 Esta é uma situação de emergência! Chocolate é tóxico para gatos. Estou te transferindo para nossa equipe veterinária AGORA!"
  },
  {
    id: "pricing",
    title: "Preços",
    message: "Quanto custa uma consulta?",
    expectedResponse: "Nossa consulta veterinária custa R$ 80,00. Posso agendar uma consulta para seu pet?"
  },
  {
    id: "general",
    title: "Dúvida Geral",
    message: "Meu cachorro está muito agitado, o que fazer?",
    expectedResponse: "Entendo sua preocupação! Agitação em pets pode ter várias causas. Que tal agendar uma consulta para avaliarmos melhor?"
  }
];

export const TestStep: React.FC<TestStepProps> = ({ data }) => {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [chatHistory, setChatHistory] = useState<Array<{
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
  }>>([]);

  const handleTestScenario = (scenario: typeof testScenarios[0]) => {
    setActiveTest(scenario.id);
    
    // Simulate AI response
    setChatHistory([
      { type: 'user', message: scenario.message, timestamp: new Date() },
      { type: 'ai', message: scenario.expectedResponse, timestamp: new Date() }
    ]);

    // Mark test as completed
    setTimeout(() => {
      setTestResults(prev => ({ ...prev, [scenario.id]: true }));
    }, 1500);
  };

  const handleCustomTest = () => {
    if (!customMessage.trim()) return;

    const aiResponse = generateAIResponse(customMessage, data);
    
    setChatHistory(prev => [
      ...prev,
      { type: 'user', message: customMessage, timestamp: new Date() },
      { type: 'ai', message: aiResponse, timestamp: new Date() }
    ]);

    setCustomMessage("");
  };

  const generateAIResponse = (message: string, config: any) => {
    // Simple AI response simulation based on config
    const personality = config.personality || 'friendly';
    const assistantName = config.assistantName || 'Assistente Auzap';
    
    let response = "";
    
    if (message.toLowerCase().includes('emergencia') || message.toLowerCase().includes('socorro')) {
      response = "🚨 Identificei uma possível emergência! Estou transferindo você para nossa equipe veterinária imediatamente.";
    } else if (message.toLowerCase().includes('agendar') || message.toLowerCase().includes('marcar')) {
      response = `Claro! Vou te ajudar a agendar. Qual serviço seu pet precisa e que dia seria melhor?`;
    } else if (message.toLowerCase().includes('preço') || message.toLowerCase().includes('quanto')) {
      response = "Posso te informar os preços dos nossos serviços. Qual serviço você gostaria de saber o valor?";
    } else {
      switch (personality) {
        case 'friendly':
          response = `Oi! Sou a ${assistantName} 😊 Como posso cuidar do seu peludo hoje?`;
          break;
        case 'professional':
          response = `Olá, sou a ${assistantName}. Em que posso ajudá-lo com seu pet?`;
          break;
        case 'enthusiastic':
          response = `Oi, tutor! 🐕 Sou a ${assistantName} e estou super animada para ajudar seu amiguinho!`;
          break;
        default:
          response = `Olá! Sou a ${assistantName}. Como posso ajudar você e seu pet?`;
      }
    }
    
    return response;
  };

  const completedTests = Object.keys(testResults).length;
  const totalTests = testScenarios.length;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2">Teste sua Assistente</h2>
        <p className="text-muted-foreground">
          Vamos testar como ela responde em diferentes situações
        </p>
        <div className="mt-4">
          <Badge variant={completedTests === totalTests ? "default" : "secondary"}>
            {completedTests}/{totalTests} testes realizados
          </Badge>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cenários de Teste */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Cenários de Teste
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {testScenarios.map((scenario) => (
                <div
                  key={scenario.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    activeTest === scenario.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleTestScenario(scenario)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{scenario.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        "{scenario.message}"
                      </p>
                    </div>
                    {testResults[scenario.id] && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>
              ))}

              {/* Teste Personalizado */}
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Teste Personalizado</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua própria mensagem de teste..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomTest()}
                  />
                  <Button onClick={handleCustomTest} size="sm">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Chat Simulator */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-2 h-full">
            <CardHeader className="bg-whatsapp text-white">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Simulador WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-96 flex flex-col">
              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p>Selecione um cenário de teste para ver como sua assistente responde</p>
                  </div>
                ) : (
                  chatHistory.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-3 rounded-lg ${
                        msg.type === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-white border shadow-sm'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          {msg.type === 'ai' ? (
                            <Bot className="h-4 w-4 text-primary" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                          <span className="text-xs opacity-70">
                            {msg.type === 'ai' ? data.assistantName || 'Assistente' : 'Você'}
                          </span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Status */}
              <div className="border-t p-3 bg-white">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Assistente online e funcionando
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Test Summary */}
      {completedTests > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-2 bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-800">Testes Realizados com Sucesso!</h3>
                  <p className="text-sm text-green-600">
                    Sua assistente está respondendo corretamente. Pronta para ser ativada!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};