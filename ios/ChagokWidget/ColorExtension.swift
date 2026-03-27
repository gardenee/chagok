import SwiftUI

extension Color {
  init(hex: String) {
    let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var int: UInt64 = 0
    Scanner(string: hex).scanHexInt64(&int)
    let r = Double((int >> 16) & 0xFF) / 255
    let g = Double((int >> 8) & 0xFF) / 255
    let b = Double(int & 0xFF) / 255
    self.init(red: r, green: g, blue: b)
  }
}

extension Color {
  static let chagokButter = Color(hex: "FAD97A")
  static let chagokBrown = Color(hex: "7B5E3A")
  static let chagokCream = Color(hex: "FEFCF5")
  static let chagokPeach = Color(hex: "F7B8A0")
  static let chagokLavender = Color(hex: "D4C5F0")
}
