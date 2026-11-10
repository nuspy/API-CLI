BeforeAll {
    $ModuleRoot = "$PSScriptRoot\..\.."
    . "$ModuleRoot\Private\Configuration.ps1"
    . "$ModuleRoot\Private\ProcessRunner.ps1"
}

Describe 'CLI Tool Registry' {
    It 'has claude, codex, gemini, droid registered by default' {
        $tools = Get-RegisteredCLITools
        $tools.Keys | Should -Contain 'claude'
        $tools.Keys | Should -Contain 'codex'
        $tools.Keys | Should -Contain 'gemini'
        $tools.Keys | Should -Contain 'droid'
    }

    It 'reports availability for each tool' {
        $installed = Get-InstalledCLITools
        $installed.Keys.Count | Should -BeGreaterOrEqual 4
        foreach ($key in $installed.Keys) {
            $installed[$key].Name      | Should -Be $key
            $installed[$key].Available | Should -BeOfType [bool]
        }
    }

    It 'can register a custom tool' {
        Register-CLITool -Name 'custom' -Tool @{
            Command     = 'echo'
            BuildArgs   = { param($Prompt, $Model, $SystemPrompt) @($Prompt) }
            ParseOutput = { param($RawOutput) @{ Content = $RawOutput; Raw = $null } }
        }
        $tools = Get-RegisteredCLITools
        $tools.Keys | Should -Contain 'custom'
        $tools['custom'].ExtractSessionId | Should -BeNullOrEmpty
    }

    It 'throws when registering a tool without required keys' {
        { Register-CLITool -Name 'bad' -Tool @{ Command = 'x' } } | Should -Throw '*missing required key*'
    }

    It 'throws for unknown provider in Invoke-CLITool' {
        { Invoke-CLITool -Provider 'nonexistent' -Prompt 'test' } | Should -Throw '*Unknown provider*'
    }
}

Describe 'Claude CLI args' {
    It 'builds basic args' {
        $tool = (Get-RegisteredCLITools)['claude']
        $a = & $tool.BuildArgs 'Hello' $null $null $null
        $a | Should -Contain '-p'
        $a | Should -Contain 'Hello'
        $a | Should -Contain '--output-format'
        $a | Should -Contain 'json'
    }

    It 'includes model and system prompt when provided' {
        $tool = (Get-RegisteredCLITools)['claude']
        $a = & $tool.BuildArgs 'Hi' 'claude-sonnet-4-20250514' 'Be helpful' $null
        $a | Should -Contain '--model'
        $a | Should -Contain 'claude-sonnet-4-20250514'
        $a | Should -Contain '--system-prompt'
        $a | Should -Contain 'Be helpful'
    }

    It 'includes --resume when SessionId is provided' {
        $tool = (Get-RegisteredCLITools)['claude']
        $a = & $tool.BuildArgs 'Hi' $null $null 'sess-abc-123'
        $a | Should -Contain '--resume'
        $a | Should -Contain 'sess-abc-123'
    }

    It 'omits --resume when SessionId is null' {
        $tool = (Get-RegisteredCLITools)['claude']
        $a = & $tool.BuildArgs 'Hi' $null $null $null
        $a | Should -Not -Contain '--resume'
    }
}

Describe 'Codex CLI args' {
    It 'builds exec args' {
        $tool = (Get-RegisteredCLITools)['codex']
        $a = & $tool.BuildArgs 'Hello' $null $null $null
        $a | Should -Contain 'exec'
        $a | Should -Contain '-'
    }

    It 'includes model when provided' {
        $tool = (Get-RegisteredCLITools)['codex']
        $a = & $tool.BuildArgs 'Hi' 'o3-mini' $null $null
        $a | Should -Contain '--model'
        $a | Should -Contain 'o3-mini'
    }

    It 'ignores SessionId (no native support)' {
        $tool = (Get-RegisteredCLITools)['codex']
        $a = & $tool.BuildArgs 'Hi' $null $null 'some-session'
        $a | Should -Not -Contain '-s'
        $a | Should -Not -Contain 'some-session'
    }
}

Describe 'Gemini CLI args' {
    It 'builds basic args' {
        $tool = (Get-RegisteredCLITools)['gemini']
        $a = & $tool.BuildArgs 'Hello' $null $null $null
        $a | Should -Contain '-p'
        $a | Should -Contain 'Hello'
    }

    It 'includes model when provided' {
        $tool = (Get-RegisteredCLITools)['gemini']
        $a = & $tool.BuildArgs 'Hi' 'gemini-2.0-flash' $null $null
        $a | Should -Contain '--model'
        $a | Should -Contain 'gemini-2.0-flash'
    }

    It 'ignores SessionId (no native support)' {
        $tool = (Get-RegisteredCLITools)['gemini']
        $a = & $tool.BuildArgs 'Hi' $null $null 'some-session'
        $a | Should -Not -Contain '-s'
        $a | Should -Not -Contain 'some-session'
    }
}

Describe 'Droid CLI args' {
    It 'builds exec args with JSON output' {
        $tool = (Get-RegisteredCLITools)['droid']
        $a = & $tool.BuildArgs 'Hello' $null $null $null
        $a | Should -Contain 'exec'
        $a | Should -Contain 'Hello'
        $a | Should -Contain '-o'
        $a | Should -Contain 'json'
    }

    It 'includes model when provided' {
        $tool = (Get-RegisteredCLITools)['droid']
        $a = & $tool.BuildArgs 'Hi' 'gpt-4o' $null $null
        $a | Should -Contain '-m'
        $a | Should -Contain 'gpt-4o'
    }

    It 'includes -s when SessionId is provided' {
        $tool = (Get-RegisteredCLITools)['droid']
        $a = & $tool.BuildArgs 'Hi' $null $null 'droid-sess-42'
        $a | Should -Contain '-s'
        $a | Should -Contain 'droid-sess-42'
    }

    It 'omits -s when SessionId is null' {
        $tool = (Get-RegisteredCLITools)['droid']
        $a = & $tool.BuildArgs 'Hi' $null $null $null
        $a | Should -Not -Contain '-s'
    }

    It 'is not input-via-pipe' {
        $tool = (Get-RegisteredCLITools)['droid']
        $tool.InputViaPipe | Should -Be $false
    }
}

Describe 'Output parsing' {
    It 'claude parser extracts result from JSON' {
        $tool = (Get-RegisteredCLITools)['claude']
        $fakeJson = '{"result":"Hello world","cost_usd":0.001,"session_id":"sess-001"}'
        $parsed = & $tool.ParseOutput $fakeJson
        $parsed.Content | Should -Be 'Hello world'
        $parsed.Raw.session_id | Should -Be 'sess-001'
    }

    It 'claude parser falls back to raw on invalid JSON' {
        $tool = (Get-RegisteredCLITools)['claude']
        $parsed = & $tool.ParseOutput 'plain text response'
        $parsed.Content | Should -Be 'plain text response'
    }

    It 'codex parser returns raw output' {
        $tool = (Get-RegisteredCLITools)['codex']
        $parsed = & $tool.ParseOutput 'some output'
        $parsed.Content | Should -Be 'some output'
    }

    It 'gemini parser returns raw output' {
        $tool = (Get-RegisteredCLITools)['gemini']
        $parsed = & $tool.ParseOutput 'gemini says hi'
        $parsed.Content | Should -Be 'gemini says hi'
    }

    It 'droid parser extracts result from JSON' {
        $tool = (Get-RegisteredCLITools)['droid']
        $fakeJson = '{"result":"Droid response","session_id":"droid-42"}'
        $parsed = & $tool.ParseOutput $fakeJson
        $parsed.Content | Should -Be 'Droid response'
        $parsed.Raw.session_id | Should -Be 'droid-42'
    }

    It 'droid parser falls back to raw on invalid JSON' {
        $tool = (Get-RegisteredCLITools)['droid']
        $parsed = & $tool.ParseOutput 'plain text from droid'
        $parsed.Content | Should -Be 'plain text from droid'
    }
}

Describe 'ExtractSessionId' {
    It 'claude extracts session_id from parsed raw' {
        $tool = (Get-RegisteredCLITools)['claude']
        $fakeRaw = @{ session_id = 'sess-abc' }
        $sid = & $tool.ExtractSessionId $fakeRaw
        $sid | Should -Be 'sess-abc'
    }

    It 'claude returns null when no session_id' {
        $tool = (Get-RegisteredCLITools)['claude']
        $sid = & $tool.ExtractSessionId @{}
        $sid | Should -BeNullOrEmpty
    }

    It 'codex has no ExtractSessionId' {
        $tool = (Get-RegisteredCLITools)['codex']
        $tool.ExtractSessionId | Should -BeNullOrEmpty
    }

    It 'gemini has no ExtractSessionId' {
        $tool = (Get-RegisteredCLITools)['gemini']
        $tool.ExtractSessionId | Should -BeNullOrEmpty
    }

    It 'droid extracts session_id from parsed raw' {
        $tool = (Get-RegisteredCLITools)['droid']
        $fakeRaw = @{ session_id = 'droid-sess-99' }
        $sid = & $tool.ExtractSessionId $fakeRaw
        $sid | Should -Be 'droid-sess-99'
    }

    It 'droid returns null when no session_id' {
        $tool = (Get-RegisteredCLITools)['droid']
        $sid = & $tool.ExtractSessionId @{}
        $sid | Should -BeNullOrEmpty
    }
}
