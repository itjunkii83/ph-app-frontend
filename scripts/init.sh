#!/bin/bash
# scripts/init.sh — open an iTerm window with the three wisdom-toolkit dev servers

DIR1="$HOME/Documents/Personal/wisdom-toolkit/apps/studio"
DIR2="$HOME/Documents/Personal/wisdom-toolkit/apps/toolkit"
DIR3="$HOME/Documents/Personal/wisdom-toolkit/apps/studio/tools/codepen"

NAME1="STUDIO"
NAME2="HARBOR"
NAME3="CODEPEN"

CMD="pnpm dev"

# pre-encode badge names (iTerm requires base64)
B1=$(echo -n "$NAME1" | base64)
B2=$(echo -n "$NAME2" | base64)
B3=$(echo -n "$NAME3" | base64)

osascript <<EOF
tell application "iTerm"
  activate
  create window with default profile
  tell current window
    -- left (full height)
    tell current session
      set name to "$NAME1"
      write text "printf '\\\\e]1337;SetBadgeFormat=%s\\\\a' '$B1' && cd $DIR1 && $CMD"
      set rightPane to (split vertically with default profile)
    end tell

    -- top-right
    tell rightPane
      set name to "$NAME2"
      write text "printf '\\\\e]1337;SetBadgeFormat=%s\\\\a' '$B2' && cd $DIR2 && $CMD"
      set bottomRight to (split horizontally with default profile)
    end tell

    -- bottom-right
    tell bottomRight
      set name to "$NAME3"
      write text "printf '\\\\e]1337;SetBadgeFormat=%s\\\\a' '$B3' && cd $DIR3 && $CMD"
    end tell
  end tell
end tell
EOF
