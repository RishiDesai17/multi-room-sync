provider "google" {
  credentials = file(var.creds_file_path)
  project     = var.project
  region      = var.region
}

resource "google_compute_network" "vpc" {
  name                            = "vpc"
  routing_mode                    = var.routing_mode
  auto_create_subnetworks         = false
  delete_default_routes_on_create = true
}

resource "google_compute_subnetwork" "master_speaker_subnet" {
  name          = "master-speaker"
  ip_cidr_range = "10.0.1.0/24"
  network       = google_compute_network.vpc.self_link
  region        = var.region
}

resource "google_compute_subnetwork" "slave_speaker_subnet" {
  count         = 3
  name          = "slave-speaker-${count.index}"
  ip_cidr_range = "10.0.${count.index + 1}.0/24"
  network       = google_compute_network.vpc.self_link
  region        = var.region
}

resource "google_compute_route" "master_speaker_subnet_route" {
  name             = "master-speaker-route"
  dest_range       = var.dest_range
  network          = google_compute_network.vpc.self_link
  next_hop_gateway = "default-internet-gateway"
  priority         = 1000
  depends_on       = [google_compute_network.vpc]
}

resource "google_compute_firewall" "master_speaker_firewall" {
  name    = "master-speaker-firewall"
  network = google_compute_network.vpc.self_link

  allow {
    protocol = "tcp"
    ports    = [3001, 22]
  }

  target_tags   = ["master_speaker"]
  source_ranges = ["0.0.0.0/0"]

  depends_on = [
    google_compute_subnetwork.master_speaker_subnet
  ]
}

resource "google_compute_firewall" "slave_speaker_firewall" {
  count = 3
  name    = "slave-speaker-firewall-${count.index}"
  network = google_compute_network.vpc.self_link

  allow {
    protocol = "tcp"
    ports    = []
  }

  target_tags   = ["slave_speaker"]

  depends_on = [
    google_compute_subnetwork.slave_speaker_subnet, 
  ]
}

resource "google_compute_instance" "master_speaker" {
  name         = "master-speaker"
  machine_type = "n1-standard-1"
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = var.machine_image
      size  = "100"
      type  = "pd-balanced"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.master_speaker_subnet.self_link
    access_config {

    }
  }

  depends_on = [
    google_compute_subnetwork.master_speaker_subnet
  ]

  metadata_startup_script = "sudo echo \"SPEAKER_TYPE='master'\" >> /home/rishindesai/speaker/.env | node server.js"
}

resource "google_compute_instance" "slave_speaker" {
  count = 3
  name         = "master-speaker"
  machine_type = "n1-standard-1"
  zone         = var.zone

  boot_disk {
    initialize_params {
      image = var.machine_image
      size  = "100"
      type  = "pd-balanced"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.master_speaker_subnet.self_link
  }

  depends_on = [
    google_compute_subnetwork.slave_speaker_subnet,
    google_compute_instance.master_speaker
  ]

  metadata_startup_script = "sudo echo \"SPEAKER_TYPE='slave'\" >> /home/rishindesai/speaker/.env | sudo echo \"MASTER_SPEAKER_URL='http://10.0.1.0:3001'\" >> /home/rishindesai/speaker/.env | node server.js"
}

resource "google_compute_global_address" "private_ip_address" {
  name          = "private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
  depends_on              = [google_compute_network.vpc]
}
