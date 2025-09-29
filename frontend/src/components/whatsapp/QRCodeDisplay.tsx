import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  className?: string;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 256,
  className = ''
}) => {
  if (!value) {
    return (
      <div
        className={`flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <p className="text-gray-500 text-sm">QR Code não disponível</p>
      </div>
    );
  }

  // Se o value já é uma URL de imagem base64, mostrar como imagem
  if (value.startsWith('data:image/')) {
    return (
      <div className={`flex justify-center ${className}`}>
        <img
          src={value}
          alt="QR Code WhatsApp"
          className="border rounded-lg shadow-sm"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  // Se é apenas o código base64 sem prefixo, adicionar
  if (value.includes('/9j/') || value.includes('iVBORw0KGgo')) {
    const imageUrl = value.startsWith('data:') ? value : `data:image/png;base64,${value}`;
    return (
      <div className={`flex justify-center ${className}`}>
        <img
          src={imageUrl}
          alt="QR Code WhatsApp"
          className="border rounded-lg shadow-sm"
          style={{ width: size, height: size }}
        />
      </div>
    );
  }

  // Caso contrário, gerar QR Code com a biblioteca
  return (
    <div className={`flex justify-center p-4 bg-white rounded-lg border ${className}`}>
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        includeMargin={true}
        className="shadow-sm"
      />
    </div>
  );
};