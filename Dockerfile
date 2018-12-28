FROM debian:stretch
# TODO[pulumi/pulumi#1986]: consider switching to, or supporting, Alpine Linux for smaller image sizes.

# Label things so it lights up in GitHub Actions!
LABEL "com.github.actions.name"="Pulumi"
LABEL "com.github.actions.description"="Deploy apps and infra to your favorite cloud!"
LABEL "com.github.actions.icon"="cloud-lightning"
LABEL "com.github.actions.color"="purple"
LABEL "repository"="https://github.com/pulumi/actions"
LABEL "homepage"="http://pulumi.io/reference/gh-actions.html"
LABEL "maintainer"="Pulumi Team <team@pulumi.com>"

# Install some runtime pre-reqs.
RUN apt-get update -y
RUN apt-get install -y ca-certificates curl software-properties-common gnupg jq git

# Install the Pulumi SDK, including the CLI and language runtimes.
RUN curl -fsSL https://get.pulumi.com/ | bash -s -- --version 0.16.9 && \
    mv ~/.pulumi/bin/* /usr/bin

# Install the necessary runtimes to support Pulumi languages.
#     - Python 2.7
RUN apt install -y python-pip
#     - Node.js 10.x
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt-get install -y nodejs build-essential

# Install Docker so we can build and publish containers.
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -  && \
    add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable" && \
    apt-get update -y && \
    apt-get install -y docker-ce

# Install AWS IAM Authenticator, so AWS services like EKS can be used.
RUN curl -Lso /usr/bin/aws-iam-authenticator https://amazon-eks.s3-us-west-2.amazonaws.com/1.10.3/2018-07-26/bin/linux/amd64/aws-iam-authenticator && \
    chmod +x /usr/bin/aws-iam-authenticator

# Install all the cloud CLIs, so we are prepared to deploy to them.
#     - AWS
RUN pip install awscli --upgrade
#     - Azure
RUN echo "deb [arch=amd64] https://packages.microsoft.com/repos/azure-cli/ $(lsb_release -cs) main" | \
        tee /etc/apt/sources.list.d/azure-cli.list && \
    curl -L https://packages.microsoft.com/keys/microsoft.asc | apt-key add - && \
    apt-get update -y && apt-get install -y azure-cli

#     - Google Cloud
RUN echo "deb http://packages.cloud.google.com/apt cloud-sdk-$(lsb_release -c -s) main" | \
        tee -a /etc/apt/sources.list.d/google-cloud-sdk.list && \
    curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - && \
    apt-get update -y && apt-get install -y google-cloud-sdk
#     - Kubernetes
RUN curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add - && \
    echo "deb http://apt.kubernetes.io/ kubernetes-xenial main" | \
        tee -a /etc/apt/sources.list.d/kubernetes.list && \
    apt-get update -y && apt-get install -y kubectl

# Copy the entrypoint script.
COPY ./entrypoint.sh /usr/bin/pulumi-action

# The app directory should contain the Pulumi program and is the pwd for the CLI.
WORKDIR /app
VOLUME ["/app"]

# The app.pulumi.com access token is specified as an environment variable. You can create a new
# access token on your account page at https://app.pulumi.com/account. Please override this when
# running the Docker container using `docker run pulumi/pulumi -e "PULUMI_ACCESS_TOKEN=a1b2c2def9"`.
# ENV PULUMI_ACCESS_TOKEN

# This image uses a thin wrapper over the Pulumi CLI as its entrypoint. As a result, you may run commands
# simply by running `docker run pulumi/pulumi up` to run the program mounted in the `/app` volume location.
ENTRYPOINT ["/usr/bin/pulumi-action", "--non-interactive"]
