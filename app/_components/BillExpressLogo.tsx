import React from "react";
import { cn } from "../_lib/utils";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  usePrimaryColor?: boolean;
  responsive?: boolean;
}

export const BillExpressLogo: React.FC<LogoProps> = ({ width = 150, height = 40, className, usePrimaryColor = false, responsive = false }) => {
  // Clases responsivas para controlar el tamaño general
  const responsiveClasses = responsive ? "w-[120px] h-[30px] sm:w-[150px] sm:h-[40px] md:w-[200px] md:h-[60px]" : "";
  
  // Calcula el tamaño del icono basado en la altura total
  const iconSize = responsive ? undefined : height;
  const iconResponsiveClasses = responsive ? "h-full w-auto" : "";

  return (
    <div className={cn("flex items-center gap-2 select-none", responsiveClasses, className)} style={responsive ? {} : { width: `${width}px`, height: `${height}px` }}>
      {/* Icono cargado desde logo-icon.svg */}
      <img 
        src="/logo-icon.svg" 
        alt="BillExpress Icon" 
        className={cn("object-contain pointer-events-none", iconResponsiveClasses)}
        style={responsive ? {} : { height: `${iconSize}px`, width: 'auto' }}
        draggable="false"
      />
      
      {/* Texto "BillExpress" como SVG inline */}
      <svg
        viewBox="5500 4600 7200 1200" // Ajustado para contener solo el texto
        className={cn("h-full w-auto flex-grow transition-colors duration-300 pointer-events-none", usePrimaryColor ? "fill-primary" : "fill-gray-900 dark:fill-white")}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grupo para aplicar la transformación de volteo vertical */}
        <g transform="scale(1, -1) translate(0, -10400)">
          {/* Solo los paths del texto "BillExpress" */}
          <path d="M6990 5200 l0 -520 95 0 95 0 0 520 0 520 -95 0 -95 0 0 -520z" />
          <path d="M7337 5713 c-4 -3 -7 -237 -7 -520 l0 -513 95 0 95 0 0 520 0 520 -88 0 c-49 0 -92 -3 -95 -7z"/>
          <path d="M5765 5195 l0 -515 228 0 c256 0 334 11 410 60 103 65 150 192 116 314 -14 51 -80 120 -140 148 l-50 22 28 14 c42 21 94 73 109 109 36 83 3 218 -66 276 -87 74 -152 87 -423 87 l-212 0 0 -515z m424 335 c77 -22 111 -101 75 -175 -25 -53 -61 -65 -194 -65 l-110 0 0 125 0 125 98 0 c53 0 112 -4 131 -10z m74 -431 c42 -21 57 -51 57 -112 0 -51 -4 -62 -28 -87 -39 -39 -88 -50 -219 -50 l-113 0 0 130 0 130 141 0 c84 0 149 -5 162 -11z"/>
          <path d="M7675 5195 l0 -515 318 0 317 0 0 90 0 90 -215 0 -215 0 0 120 0 120 190 0 190 0 0 88 0 87 -195 0 -195 0 0 128 0 127 210 0 210 0 0 90 0 90 -307 0 -308 0 0 -515z"/>
          <path d="M9494 5414 c-23 -8 -60 -30 -82 -50 l-41 -34 -6 45 -7 45 -89 0 -89 0 0 -515 0 -515 100 0 100 0 0 180 c0 99 2 180 4 180 2 0 27 -15 55 -34 117 -79 288 -54 388 57 19 22 49 69 67 106 29 62 31 73 31 181 0 112 -1 117 -34 178 -83 154 -251 228 -397 176z m141 -167 c77 -44 121 -160 96 -253 -26 -97 -92 -154 -178 -154 -114 0 -183 79 -183 207 0 75 14 125 47 164 52 62 145 77 218 36z"/>
          <path d="M10334 5406 c-28 -13 -63 -39 -77 -57 l-27 -34 0 37 c0 66 -3 68 -99 68 l-86 0 0 -370 0 -370 98 0 97 0 0 224 c0 216 1 224 23 257 32 48 91 78 160 81 l57 3 0 93 0 92 -47 0 c-29 0 -68 -10 -99 -24z"/>
          <path d="M10752 5411 c-147 -51 -230 -195 -220 -385 9 -162 66 -259 184 -317 56 -28 80 -34 156 -37 178 -9 308 66 356 206 l11 32 -98 0 c-95 0 -98 -1 -109 -25 -27 -59 -137 -84 -217 -51 -40 17 -83 78 -92 130 l-6 36 262 0 261 0 0 68 c0 175 -87 304 -234 347 -69 21 -189 19 -254 -4z m216 -141 c33 -15 47 -29 62 -62 11 -24 20 -53 20 -65 0 -23 0 -23 -165 -23 -187 0 -184 -2 -142 80 43 86 130 113 225 70z"/>
          <path d="M11487 5414 c-145 -45 -201 -221 -105 -330 41 -46 84 -67 196 -94 114 -28 142 -47 142 -99 0 -53 -32 -81 -94 -81 -61 0 -99 20 -120 65 l-17 35 -83 0 -84 0 10 -42 c20 -92 98 -168 193 -189 77 -17 200 -7 255 20 93 47 130 105 130 201 0 123 -47 167 -234 219 -137 39 -156 51 -156 108 0 42 30 63 93 63 40 0 53 -5 78 -29 16 -16 29 -37 29 -45 0 -13 14 -16 85 -16 l85 0 0 30 c0 77 -55 149 -137 180 -65 24 -194 26 -266 4z"/>
          <path d="M12170 5421 c-142 -46 -212 -165 -164 -279 34 -81 94 -121 235 -153 106 -25 142 -50 142 -97 0 -20 -9 -42 -23 -57 -19 -21 -33 -25 -78 -25 -48 0 -58 4 -88 34 -19 19 -34 41 -34 50 0 13 -14 16 -91 16 l-91 0 7 -32 c19 -89 92 -168 179 -193 27 -8 82 -15 121 -15 92 0 161 21 212 64 54 47 73 90 73 166 0 67 -14 102 -57 141 -39 36 -52 42 -178 79 -120 35 -155 58 -155 102 0 43 32 68 88 68 54 0 85 -17 107 -61 15 -28 17 -29 95 -29 l80 0 0 30 c0 39 -24 98 -53 128 -45 49 -95 66 -202 69 -55 1 -111 -1 -125 -6z"/>
          <path d="M6650 5050 l0 -370 95 0 95 0 0 370 0 370 -95 0 -95 0 0 -370z"/>
          <path d="M8399 5403 c5 -10 59 -90 119 -178 l109 -160 -122 -180 c-67 -99 -125 -186 -129 -192 -6 -10 18 -13 106 -13 l113 1 70 114 c39 63 72 115 75 115 3 0 36 -52 74 -115 l69 -115 114 0 115 0 -19 28 c-10 16 -67 101 -127 190 l-110 162 122 180 121 180 -112 0 -113 0 -61 -97 c-33 -53 -64 -98 -69 -100 -5 -2 -38 42 -74 97 l-64 100 -108 0 c-101 0 -108 -1 -99 -17z"/>
        </g>
      </svg>
    </div>
  );
};

export default BillExpressLogo;
