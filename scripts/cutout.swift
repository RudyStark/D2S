// Subject cutout with Apple Vision (macOS 14+).
// Usage: swiftc -O scripts/cutout.swift -o .cache/cutout && .cache/cutout in.png out.png
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count == 3 else {
  FileHandle.standardError.write("usage: cutout <input> <output.png>\n".data(using: .utf8)!)
  exit(2)
}

let input = URL(fileURLWithPath: args[1])
let output = URL(fileURLWithPath: args[2])
let handler = VNImageRequestHandler(url: input)
let request = VNGenerateForegroundInstanceMaskRequest()
try handler.perform([request])

guard let observation = request.results?.first, !observation.allInstances.isEmpty else {
  FileHandle.standardError.write("no subject found in \(input.path)\n".data(using: .utf8)!)
  exit(1)
}

let buffer = try observation.generateMaskedImage(
  ofInstances: observation.allInstances,
  from: handler,
  croppedToInstancesExtent: false
)
let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
try CIContext().writePNGRepresentation(
  of: CIImage(cvPixelBuffer: buffer),
  to: output,
  format: .RGBA8,
  colorSpace: colorSpace
)
print("cutout ok: \(output.lastPathComponent)")
