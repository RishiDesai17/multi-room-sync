packer {
  required_plugins {
    googlecompute = {
      version = ">= 1.1.4"
      source  = "github.com/hashicorp/googlecompute"
    }
  }
}

source "googlecompute" "centos" {
  project_id          = var.project_id
  source_image_family = var.source_image_family
  zone                = var.zone
  ssh_username        = "packer"
}

build {
  name = "speaker-vm-image"
  sources = [
    "source.googlecompute.centos"
  ]

  provisioner "file" {
    source      = "./infra/packer/scripts/"
    destination = "/tmp/"
  }

  provisioner "file" {
    source      = "./speaker.zip"
    destination = "/tmp/"
  }

  provisioner "shell" {
    inline = [
      "chmod +x /tmp/setup.sh",
      "/tmp/setup.sh"
    ]
  }
}
