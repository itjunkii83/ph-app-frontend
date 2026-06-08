export default function WebGPUFallback() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black text-white p-8">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">WebGPU Not Supported</h1>
        <p className="mb-4">
          This experience requires{' '}
          <a
            href="https://gpuweb.github.io/gpuweb/"
            className="text-blue-400 underline hover:text-blue-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            WebGPU
          </a>
          , which is not available in your current browser.
        </p>
        <p className="text-sm text-gray-400">
          Please try Chrome 113+, Edge 113+, or another WebGPU-compatible browser.
        </p>
      </div>
    </div>
  );
}
