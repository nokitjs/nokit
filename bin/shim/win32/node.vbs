Set ws = CreateObject("Wscript.Shell") 
Dim args
Set srcArgs = WScript.Arguments
    For Each argItem In srcArgs
        args=args+argItem+" "
    Next
Set srcArgs = Nothing
ws.run "cmd /c node " + args ,vbhide