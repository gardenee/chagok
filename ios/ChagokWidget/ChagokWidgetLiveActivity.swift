//
//  ChagokWidgetLiveActivity.swift
//  ChagokWidget
//
//  Created by garden on 3/27/26.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct ChagokWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct ChagokWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ChagokWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension ChagokWidgetAttributes {
    fileprivate static var preview: ChagokWidgetAttributes {
        ChagokWidgetAttributes(name: "World")
    }
}

extension ChagokWidgetAttributes.ContentState {
    fileprivate static var smiley: ChagokWidgetAttributes.ContentState {
        ChagokWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: ChagokWidgetAttributes.ContentState {
         ChagokWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: ChagokWidgetAttributes.preview) {
   ChagokWidgetLiveActivity()
} contentStates: {
    ChagokWidgetAttributes.ContentState.smiley
    ChagokWidgetAttributes.ContentState.starEyes
}
