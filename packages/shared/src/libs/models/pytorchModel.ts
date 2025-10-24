
// Type stubs for ONNX runtime when package is not installed
interface OrtModule {
  InferenceSession: {
    create(path: string): Promise<any>;
  };
  Tensor: new (type: string, data: any, dims: number[]) => any;
}

// Define fallback types when onnxruntime-node is not installed
type InferenceSession = any;
type Tensor = any;

// Fallback implementation when onnxruntime-node is not available
const createOrtFallback = (): OrtModule => ({
  InferenceSession: {
    create: async (path: string) => {
      throw new Error('onnxruntime-node not installed. Install with: npm install onnxruntime-node');
    }
  },
  Tensor: class {
    constructor(type: string, data: any, dims: number[]) {
      throw new Error('onnxruntime-node not installed');
    }
  }
});

// Attempt to load onnxruntime-node, fallback to stub if not available
let ort: OrtModule;
try {
  ort = require('onnxruntime-node');
} catch {
  ort = createOrtFallback();
}

export interface ModelConfig {
  modelPath: string;
  inputShape?: number[];
  outputShape?: number[];
}

export interface PredictionInput {
  teamStats?: any;
  historicalData?: number[][];
  features?: number[];
}

export interface PredictionOutput {
  winProbability: number;
  confidence: number;
  predictedScore?: number;
}

export class PytorchModel {
  private session: any = null;
  private config: ModelConfig | null = null;

  async loadModel(config: ModelConfig): Promise<void> {
    try {
      this.config = config;
      this.session = await ort.InferenceSession.create(config.modelPath);
      console.log('PyTorch model loaded successfully');
    } catch (error) {
      console.error('Failed to load PyTorch model:', error);
      throw new Error('Model loading failed');
    }
  }

  async predict(inputData: number[][]): Promise<number[]> {
    if (!this.session) {
      throw new Error('Model not loaded. Call loadModel() first.');
    }

    const flatData = inputData.flat();
    const inputTensor = new ort.Tensor(
      'float32',
      new Float32Array(flatData),
      [inputData.length, inputData[0].length]
    );

    const feeds = { input: inputTensor };
    const results = await this.session.run(feeds);
    
    return Array.from(results.output.data as Float32Array);
  }

  async predictGameOutcome(input: PredictionInput): Promise<PredictionOutput> {
    if (!this.session) {
      throw new Error('Model not loaded');
    }

    const features = this.preprocessInput(input);
    const prediction = await this.predict([features]);
    
    return {
      winProbability: Math.max(0, Math.min(1, prediction[0])),
      confidence: Math.max(0, Math.min(1, prediction[1] || 0.5)),
      predictedScore: prediction[2]
    };
  }

  private preprocessInput(input: PredictionInput): number[] {
    if (input.features) {
      return input.features;
    }

    if (input.teamStats) {
      return this.extractTeamFeatures(input.teamStats);
    }

    if (input.historicalData) {
      return input.historicalData.flat();
    }

    throw new Error('No valid input data provided');
  }

  private extractTeamFeatures(stats: any): number[] {
    return [
      stats.wins || 0,
      stats.losses || 0,
      stats.pointsPerGame || 0,
      stats.pointsAllowedPerGame || 0,
      stats.offensiveRating || 0,
      stats.defensiveRating || 0,
      stats.homeWinPercentage || 0,
      stats.awayWinPercentage || 0,
      stats.recentFormScore || 0,
      stats.headToHeadRecord || 0
    ];
  }

  isLoaded(): boolean {
    return this.session !== null;
  }

  async unload(): Promise<void> {
    if (this.session) {
      this.session = null;
      this.config = null;
      console.log('Model unloaded');
    }
  }

  getModelInfo(): ModelConfig | null {
    return this.config;
  }
}

export const pytorchModelInstance = new PytorchModel();

export async function initializePytorchModel(modelPath: string): Promise<PytorchModel> {
  const model = new PytorchModel();
  await model.loadModel({ modelPath });
  return model;
}
