terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  type = string
}

variable "region" {
  type    = string
  default = "us-central1"
}

# Service Account for Cloud Run
resource "google_service_account" "momentlab_sa" {
  account_id   = "momentlab-run-sa"
  display_name = "MomentLab Cloud Run Service Account"
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "momentlab_repo" {
  location      = var.region
  repository_id = "momentlab-repo"
  description   = "Docker repository for MomentLab services"
  format        = "DOCKER"
}

# Cloud Run Service (Backend)
resource "google_cloud_run_v2_service" "momentlab_backend" {
  name     = "momentlab-backend"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.momentlab_sa.email
    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.momentlab_repo.name}/backend:latest"
      
      env {
        name = "CLICKHOUSE_HOST"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.clickhouse_host.secret_id
            version = "latest"
          }
        }
      }
    }
  }
}

# Secret Manager for Database Credentials
resource "google_secret_manager_secret" "clickhouse_host" {
  secret_id = "clickhouse-host"
  replication {
    auto {}
  }
}
