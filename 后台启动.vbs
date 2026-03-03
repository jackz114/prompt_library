Set WshShell = CreateObject("WScript.Shell")
Set FSO = CreateObject("Scripting.FileSystemObject")
strPath = FSO.GetParentFolderName(WScript.ScriptFullName)

' 构建命令：cd 到目录 && 运行 python
strCmd = "cmd /c cd /d """ & strPath & """ && python server/main.py"

' 运行命令，第二个参数 0 表示隐藏窗口，第三个参数 False 表示不等待完成
WshShell.Run strCmd, 0, False
