# PSLLMKit.psm1 - REST API gateway for agentic coding CLI tools

$ModuleRoot = $PSScriptRoot

# Private
. "$ModuleRoot\Private\Configuration.ps1"
. "$ModuleRoot\Private\ProcessRunner.ps1"
. "$ModuleRoot\Private\HttpServer.ps1"

# Public
. "$ModuleRoot\Public\Start-LLMServer.ps1"
. "$ModuleRoot\Public\Stop-LLMServer.ps1"
. "$ModuleRoot\Public\Get-LLMServerStatus.ps1"
. "$ModuleRoot\Public\Invoke-LLMPrompt.ps1"

Export-ModuleMember -Function @(
    'Start-LLMServer'
    'Stop-LLMServer'
    'Get-LLMServerStatus'
    'Invoke-LLMPrompt'
    'Register-CLITool'
    'Get-InstalledCLITools'
    'Invoke-CLITool'
)
