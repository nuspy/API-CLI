BeforeAll {
    Import-Module "$PSScriptRoot\..\..\PSLLMKit.psd1" -Force
}

Describe 'Module loads correctly' {
    It 'exports Start-LLMServer' {
        Get-Command Start-LLMServer -Module PSLLMKit | Should -Not -BeNullOrEmpty
    }
    It 'exports Stop-LLMServer' {
        Get-Command Stop-LLMServer -Module PSLLMKit | Should -Not -BeNullOrEmpty
    }
    It 'exports Get-LLMServerStatus' {
        Get-Command Get-LLMServerStatus -Module PSLLMKit | Should -Not -BeNullOrEmpty
    }
    It 'exports Invoke-LLMPrompt' {
        Get-Command Invoke-LLMPrompt -Module PSLLMKit | Should -Not -BeNullOrEmpty
    }
    It 'exports Register-CLITool' {
        Get-Command Register-CLITool -Module PSLLMKit | Should -Not -BeNullOrEmpty
    }
}

Describe 'Server lifecycle (single instance)' {
    AfterEach {
        Stop-LLMServer -All -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }

    It 'reports no instances running before start' {
        $s = Get-LLMServerStatus
        $s | Should -BeNullOrEmpty
    }

    It 'starts and stops a single app instance' {
        Start-LLMServer -App claude -Port 18080
        $s = Get-LLMServerStatus -App claude
        $s.Running | Should -Be $true
        $s.Port    | Should -Be 18080
        $s.App     | Should -Be 'claude'

        Stop-LLMServer -App claude
        $s = Get-LLMServerStatus -App claude
        $s.Running | Should -Be $false
    }

    It 'responds to /api/health with app name' {
        Start-LLMServer -App claude -Port 18081
        Start-Sleep -Seconds 1
        $r = Invoke-RestMethod -Uri 'http://localhost:18081/api/health'
        $r.status | Should -Be 'running'
        $r.app    | Should -Be 'claude'
        $r.port   | Should -Be 18081
    }

    It 'responds to /api/status' {
        Start-LLMServer -App claude -Port 18082
        Start-Sleep -Seconds 1
        $r = Invoke-RestMethod -Uri 'http://localhost:18082/api/status'
        $r.app     | Should -Be 'claude'
        $r.running | Should -Be $true
        $r.port    | Should -Be 18082
    }

    It 'resets session via /api/session/reset' {
        Start-LLMServer -App claude -Port 18083
        Start-Sleep -Seconds 1
        $r = Invoke-RestMethod -Uri 'http://localhost:18083/api/session/reset' -Method Post
        $r.message | Should -Be 'Session reset'
    }

    It 'returns 404 for unknown routes' {
        Start-LLMServer -App claude -Port 18084
        Start-Sleep -Seconds 1
        $threw = $false
        try {
            Invoke-RestMethod -Uri 'http://localhost:18084/unknown' -ErrorAction Stop
        }
        catch {
            $threw = $true
            $_.Exception.Response.StatusCode.value__ | Should -Be 404
        }
        $threw | Should -Be $true
    }

    It 'returns 405 for GET on /api/prompt' {
        Start-LLMServer -App claude -Port 18085
        Start-Sleep -Seconds 1
        $threw = $false
        try {
            Invoke-RestMethod -Uri 'http://localhost:18085/api/prompt' -Method Get -ErrorAction Stop
        }
        catch {
            $threw = $true
            $_.Exception.Response.StatusCode.value__ | Should -Be 405
        }
        $threw | Should -Be $true
    }

    It 'returns 400 when prompt is missing' {
        Start-LLMServer -App claude -Port 18086
        Start-Sleep -Seconds 1
        $threw = $false
        try {
            Invoke-RestMethod -Uri 'http://localhost:18086/api/prompt' -Method Post `
                -ContentType 'application/json' `
                -Body '{}' -ErrorAction Stop
        }
        catch {
            $threw = $true
            $_.Exception.Response.StatusCode.value__ | Should -Be 400
        }
        $threw | Should -Be $true
    }
}

Describe 'Multi-instance server' {
    AfterEach {
        Stop-LLMServer -All -ErrorAction SilentlyContinue
        Start-Sleep -Milliseconds 500
    }

    It 'runs two instances on different ports' {
        Start-LLMServer -App claude -Port 18090
        Start-LLMServer -App codex  -Port 18091
        Start-Sleep -Seconds 1

        $h1 = Invoke-RestMethod -Uri 'http://localhost:18090/api/health'
        $h2 = Invoke-RestMethod -Uri 'http://localhost:18091/api/health'
        $h1.app | Should -Be 'claude'
        $h2.app | Should -Be 'codex'
    }

    It 'lists all running instances' {
        Start-LLMServer -App claude -Port 18092
        Start-LLMServer -App codex  -Port 18093

        $all = Get-LLMServerStatus
        $all.Count | Should -Be 2
        ($all | ForEach-Object { $_.App }) | Should -Contain 'claude'
        ($all | ForEach-Object { $_.App }) | Should -Contain 'codex'
    }

    It 'prevents duplicate app instance' {
        Start-LLMServer -App claude -Port 18094
        { Start-LLMServer -App claude -Port 18095 } | Should -Throw '*already running*'
    }

    It 'prevents duplicate port usage' {
        Start-LLMServer -App claude -Port 18096
        { Start-LLMServer -App codex -Port 18096 } | Should -Throw '*already in use*'
    }

    It 'Stop-LLMServer -All stops all instances' {
        Start-LLMServer -App claude -Port 18097
        Start-LLMServer -App codex  -Port 18098
        Stop-LLMServer -All

        $all = Get-LLMServerStatus
        $all | Should -BeNullOrEmpty
    }
}

Describe 'Invoke-LLMPrompt parameters' {
    It 'Prompt is mandatory' {
        $cmd = Get-Command Invoke-LLMPrompt
        ($cmd.Parameters['Prompt'].Attributes |
            Where-Object { $_ -is [System.Management.Automation.ParameterAttribute] -and $_.Mandatory }
        ) | Should -Not -BeNullOrEmpty
    }

    It 'App is mandatory' {
        $cmd = Get-Command Invoke-LLMPrompt
        ($cmd.Parameters['App'].Attributes |
            Where-Object { $_ -is [System.Management.Automation.ParameterAttribute] -and $_.Mandatory }
        ) | Should -Not -BeNullOrEmpty
    }

    It 'SessionId is optional' {
        $cmd = Get-Command Invoke-LLMPrompt
        $cmd.Parameters.ContainsKey('SessionId') | Should -Be $true
        $mandatory = $cmd.Parameters['SessionId'].Attributes |
            Where-Object { $_ -is [System.Management.Automation.ParameterAttribute] -and $_.Mandatory }
        $mandatory | Should -BeNullOrEmpty
    }
}

AfterAll {
    Stop-LLMServer -All -ErrorAction SilentlyContinue
    Remove-Module PSLLMKit -ErrorAction SilentlyContinue
}
