FROM amazonlinux:latest

ARG TERRAFORM_VERSION=0.11.11
ARG NODE_VERSION=8.x
ARG YARN_REPO="/etc/yum.repos.d/yarn.repo"
ARG AWSCLI_VERSION=1.16.86

# Install C and wget
RUN yum install gcc44 gcc-c++ libgcc44 cmake wget tar gzip zip unzip make openssl-devel -y

# Install Terraform
RUN curl -sL https://releases.hashicorp.com/terraform/"$TERRAFORM_VERSION"/terraform_"$TERRAFORM_VERSION"_linux_amd64.zip -o terraform_"$TERRAFORM_VERSION"_linux_amd64.zip && \
unzip terraform_"$TERRAFORM_VERSION"_linux_amd64.zip -d /usr/bin && \
chmod +x /usr/bin/terraform

# Install node
RUN curl -sL https://rpm.nodesource.com/setup_"$NODE_VERSION" | bash -
RUN yum -y install nodejs

# Install yarn
RUN wget https://dl.yarnpkg.com/rpm/yarn.repo -O $YARN_REPO && \
    yum install -y yarn

# Install aws cli
RUN curl -sL https://s3.amazonaws.com/aws-cli/awscli-bundle.zip \
    -o awscli-bundle.zip && \
    unzip awscli-bundle.zip -d /tmp && \
    /tmp/awscli-bundle/install -i /usr/local/aws -b /usr/local/bin/aws

# Install development tools
RUN yum -y install http://dl.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
RUN yum -y install git
RUN yum -y install jq

RUN mkdir -p /project

WORKDIR /project/

EXPOSE 8080

CMD ["/bin/bash"]
