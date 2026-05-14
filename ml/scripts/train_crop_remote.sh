#!/bin/bash
# Run a single-crop training job on the inference EC2 against the in-VPC MLflow.
# Intended to be invoked via AWS SSM RunCommand (see .github/workflows/retrain.yml).
#
# Args: $1 crop  $2 epochs (default 3)  $3 batch_size (default 16)  $4 lr (default 1e-4)  $5 stage (default Staging)
set -euxo pipefail

CROP="$1"
EPOCHS="${2:-3}"
BATCH_SIZE="${3:-16}"
LR="${4:-1e-4}"
STAGE="${5:-Staging}"

export MLFLOW_TRACKING_URI="${MLFLOW_TRACKING_URI:-http://ip-10-0-10-72.ec2.internal:5000}"
export PYTHONPATH=/opt/app/ml
export AWS_DEFAULT_REGION=us-east-1
export TMPDIR=/var/tmp

sudo mkdir -p /var/log/cropsight && sudo chown ec2-user:ec2-user /var/log/cropsight
LOG="/var/log/cropsight/train-${CROP}.log"
echo "$(date) starting crop=$CROP epochs=$EPOCHS bs=$BATCH_SIZE lr=$LR stage=$STAGE" > "$LOG"

cd /opt/app
sudo -u ec2-user git fetch origin
sudo -u ec2-user git checkout dev
sudo -u ec2-user git reset --hard origin/dev

cd /opt/app/ml
mkdir -p data/processed
aws s3 sync --quiet "s3://cropsight-dataset-ml/processed/${CROP}" "data/processed/${CROP}"
echo "synced $(find data/processed/${CROP} -type f | wc -l) files" | tee -a "$LOG"

sudo -u ec2-user env \
  MLFLOW_TRACKING_URI="$MLFLOW_TRACKING_URI" \
  PYTHONPATH=/opt/app/ml \
  AWS_DEFAULT_REGION=us-east-1 \
  python3 -u -m src.training.train \
    --crop "$CROP" \
    --data_dir "data/processed/${CROP}" \
    --epochs "$EPOCHS" \
    --batch_size "$BATCH_SIZE" \
    --lr "$LR" 2>&1 | tee -a "$LOG"

sudo -u ec2-user env \
  MLFLOW_TRACKING_URI="$MLFLOW_TRACKING_URI" \
  PYTHONPATH=/opt/app/ml \
  python3 -u -m src.registry.register \
    --crop "$CROP" \
    --stage "$STAGE" 2>&1 | tee -a "$LOG"

echo "TRAIN_DONE crop=$CROP" | tee -a "$LOG"
