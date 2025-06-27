export interface Report {
  fecha_inicio: string;
  fecha_fin: string;
  pocs: Poc[];
}

export interface Poc {
  name: string;
  POC_NAME: string;
  ruta_archivo: string;
}

export interface ReportResult {
  name: string;
  poc: string;
  dates: {
    start: string;
    end: string;
    score: number;
    response_time: string;
    total_time: string;
    sentiment_distribution: {
      Positivo: number;
      Negativo: number;
      Neutral: number;
    };
  }[];
}
