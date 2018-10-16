workflow "Update" {
    on = "push"
    resolves = [ "Pulumi Deploy (Current Stack)" ]
}

action "Pulumi Deploy (Current Stack)" {
    uses = "docker://pulumi/actions@v0.16.0"
    args = [ "up" ]
    env = {
        "PULUMI_CI" = "up"
    }
    secrets = [
        "PULUMI_ACCESS_TOKEN"
    ]
}

workflow "Preview" {
    on = "pull_request"
    resolves = "Pulumi Preview (Merged Stack)"
}

action "Pulumi Preview (Merged Stack)" {
    uses = "docker://pulumi/actions@v0.16.0"
    args = [ "preview" ]
    env = {
        "PULUMI_CI" = "pr"
    }
    secrets = [
        "PULUMI_ACCESS_TOKEN"
    ]
}
