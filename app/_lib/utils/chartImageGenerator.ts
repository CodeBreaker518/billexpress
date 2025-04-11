import { Chart, PieController, ArcElement, Tooltip, Legend } from 'chart.js';

// Register necessary Chart.js components
Chart.register(PieController, ArcElement, Tooltip, Legend);

interface ChartDataItem {
  name: string; // Category name
  value: number; // Amount
}

interface ChartOptions {
  colors: string[]; // Colors for pie slices
  width?: number;
  height?: number;
}

export const generateChartDataUrl = async (
  data: ChartDataItem[],
  options: ChartOptions
): Promise<string | null> => {
  if (!data || data.length === 0) return null;

  // Ensure we are running in a browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.error("Chart generation requires a browser environment.");
    return null;
  }

  // Use OffscreenCanvas if available for better performance, otherwise use a regular canvas
  let canvas: HTMLCanvasElement | OffscreenCanvas;
  let context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
  const width = options.width || 400;
  const height = options.height || 300;
  
  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(width, height);
    context = canvas.getContext('2d');
  } else {
    // Fallback for browsers without OffscreenCanvas
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.display = 'none'; // Keep it hidden
    document.body.appendChild(canvas);
    context = canvas.getContext('2d');
  }

  if (!context) {
    console.error("Could not get canvas context for chart generation.");
    if (!(canvas instanceof OffscreenCanvas)) {
      document.body.removeChild(canvas); // Clean up if regular canvas was added
    }
    return null;
  }

  // Explicitly cast context as Chart.js expects specific types
  const chartContext = context as unknown as CanvasRenderingContext2D;

  let chartInstance: Chart | null = null;

  try {
    // Create the Chart.js instance
    chartInstance = new Chart(chartContext, {
      type: 'pie',
      data: {
        labels: data.map(item => item.name),
        datasets: [{
          data: data.map(item => item.value),
          backgroundColor: options.colors,
          borderWidth: 1,
        }]
      },
      options: {
        responsive: false, // Important for fixed size canvas
        animation: { duration: 0 }, // Disable animation for static image generation
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, padding: 10, font: { size: 10 } }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed !== null) {
                  label += new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(context.parsed);
                }
                return label;
              }
            }
          }
        }
      }
    });

    // Wait for the chart to render (Chart.js renders asynchronously)
    // A small delay is often needed, or use chartInstance.toBase64Image() if it reliably waits.
    await new Promise(resolve => setTimeout(resolve, 100)); // Adjust delay if needed
    
    let dataUrl: string | null = null;
    // Get the Data URL from the canvas
    if (canvas instanceof HTMLCanvasElement) {
      dataUrl = canvas.toDataURL('image/png');
    } else if (canvas instanceof OffscreenCanvas) {
      // Converting OffscreenCanvas to Blob then to DataURL
      const blob = await canvas.convertToBlob({ type: 'image/png' });
      dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
    
    return dataUrl;

  } catch (error) {
    console.error("Error generating chart image with Chart.js:", error);
    return null;
  } finally {
    // Destroy the chart instance
    if (chartInstance) {
      chartInstance.destroy();
    }
    // Clean up regular canvas if it was created
    if (canvas instanceof HTMLCanvasElement && document.body.contains(canvas)) {
      document.body.removeChild(canvas);
    }
  }
}; 