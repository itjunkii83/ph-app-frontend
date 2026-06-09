#!/bin/bash
# ~/bin/itrip

DIR1="$HOME/Documents/Websites/kora-cloud-admin"
DIR2="$HOME/Documents/Websites/kora-cloud-authority"
DIR3="$HOME/Documents/Websites/kora-cloud-api"
DIR4="$HOME/Documents/Websites/kora-cloud-simulator"

NAME1="ADMIN"
NAME2="AUTHORITY"
NAME3="API"
NAME4="SIMULATOR"

CMD="pnpm dev"

# pre-encode badge names (iTerm requires base64)
B1=$(echo -n "$NAME1" | base64)
B2=$(echo -n "$NAME2" | base64)
B3=$(echo -n "$NAME3" | base64)
B4=$(echo -n "$NAME4" | base64)

osascript <<EOF
tell application "iTerm"
  activate
  create window with default profile
  tell current window
    -- top-left
    tell current session
      set name to "$NAME1"
      write text "printf '\\\\e]1337;SetBadgeFormat=%s\\\\a' '$B1' && cd $DIR1 && $CMD"
      set topRight to (split vertically with default profile)
    end tell
    
    -- top-right
    tell topRight
      set name to "$NAME2"
      write text "printf '\\\\e]1337;SetBadgeFormat=%s\\\\a' '$B2' && cd $DIR2 && $CMD"
    end tell
    
    -- bottom-left
    tell first session of current tab
      set bottomLeft to (split horizontally with default profile)
    end tell
    tell bottomLeft
      set name to "$NAME3"
      write text "printf '\\\\e]1337;SetBadgeFormat=%s\\\\a' '$B3' && cd $DIR3 && $CMD"
    end tell
    
    -- bottom-right
    tell topRight
      set bottomRight to (split horizontally with default profile)
    end tell
    tell bottomRight
      set name to "$NAME4"
      write text "printf '\\\\e]1337;SetBadgeFormat=%s\\\\a' '$B4' && cd $DIR4 && kemu"
    end tell
  end tell
end tell
EOF