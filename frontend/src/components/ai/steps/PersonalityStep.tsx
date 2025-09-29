import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Heart, Smile, Briefcase, Users, Sparkles } from "lucide-react";

interface PersonalityStepProps {
  data: any;
  updateData: (updates: any) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const personalities = [
  {
    id: "friendly",
    name: "Amigável & Calorosa",
    icon: Heart,
    description: "Trata cada cliente como família, sempre acolhedora",
    color: "bg-pink-500/10 border-pink-500/20 text-pink-700",
    example: "Oi! 😊 Como posso cuidar do seu peludo hoje?"
  },
  {
    id: "professional",
    name: "Profissional",
    icon: Briefcase,
    description: "Formal e técnica, focada na excelência veterinária",
    color: "bg-blue-500/10 border-blue-500/20 text-blue-700",
    example: "Bom dia! Em que posso ajudá-lo com seu pet?"
  },
  {
    id: "enthusiastic",
    name: "Entusiasta",
    icon: Sparkles,
    description: "Energia contagiante, apaixonada pelos animais",
    color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-700",
    example: "Oi, tutor! 🐕 Vamos cuidar do seu amiguinho hoje?"
  },
  {
    id: "empathetic",
    name: "Empática & Cuidadosa",
    icon: Users,
    description: "Compreensiva, especialmente para situações delicadas",
    color: "bg-green-500/10 border-green-500/20 text-green-700",
    example: "Entendo sua preocupação. Vamos cuidar dele juntos."
  }
];

const avatars = [
  { id: "default", name: "Clássico", emoji: "🤖" },
  { id: "pet", name: "Pet Care", emoji: "🐕" },
  { id: "heart", name: "Coração", emoji: "💙" },
  { id: "star", name: "Estrela", emoji: "⭐" },
];

const suggestedNames = [
  "Luna", "Assistente Auzap", "Carla", "Pet Care AI", 
  "Dra. Virtuosa", "Cuidadora", "Amiga Pet", "Veterinária Virtual"
];

export const PersonalityStep: React.FC<PersonalityStepProps> = ({
  data,
  updateData,
  nextStep,
  prevStep
}) => {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-3xl font-bold mb-2">Personalize sua Assistente</h2>
        <p className="text-muted-foreground">
          Defina como ela se apresentará aos seus clientes
        </p>
      </motion.div>

      {/* Nome da Assistente */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-3"
      >
        <Label className="text-lg font-semibold">Nome da Assistente</Label>
        <Input
          placeholder="Ex: Luna, Assistente Auzap..."
          value={data.assistantName}
          onChange={(e) => updateData({ assistantName: e.target.value })}
          className="text-lg p-4"
        />
        <div className="flex flex-wrap gap-2">
          {suggestedNames.map((name) => (
            <Button
              key={name}
              variant="outline"
              size="sm"
              onClick={() => updateData({ assistantName: name })}
              className="text-xs"
            >
              {name}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Avatar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <Label className="text-lg font-semibold">Avatar da Assistente</Label>
        <div className="grid grid-cols-4 gap-4">
          {avatars.map((avatar) => (
            <Card
              key={avatar.id}
              className={`cursor-pointer transition-all duration-300 border-2 ${
                data.avatar === avatar.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => updateData({ avatar: avatar.id })}
            >
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{avatar.emoji}</div>
                <p className="text-sm font-medium">{avatar.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Personalidade */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <Label className="text-lg font-semibold">Personalidade</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalities.map((personality) => (
            <Card
              key={personality.id}
              className={`cursor-pointer transition-all duration-300 border-2 ${
                data.personality === personality.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => updateData({ personality: personality.id })}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${personality.color}`}>
                    <personality.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-2">{personality.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{personality.description}</p>
                    <Badge variant="outline" className="text-xs">
                      "{personality.example}"
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-card rounded-xl p-6 border"
      >
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Smile className="h-5 w-5" />
          Preview da Personalidade
        </h3>
        <div className="bg-whatsapp-light rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
              {data.assistantName?.charAt(0) || 'A'}
            </div>
            <span className="font-medium">{data.assistantName || 'Sua Assistente'}</span>
          </div>
          <div className="bg-white rounded-lg p-3 inline-block">
            <p className="text-sm">
              {personalities.find(p => p.id === data.personality)?.example || 
               "Olá! Como posso ajudar você e seu pet hoje?"}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};