FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime

WORKDIR /code

COPY src/requirements.txt /code/requirements.txt
RUN pip install -r /code/requirements.txt

RUN pip install torch==2.4.1+cu118 torchvision==0.19.1+cu118 torchaudio==2.4.1+cu118 --index-url https://download.pytorch.org/whl/cu118

RUN apt-get update && apt-get install -y libgl1 && apt-get install -y libglib2.0-0 && apt-get install -y git

RUN pip install git+https://github.com/sahilm75/ultralytics.git

RUN mkdir -p ./data/dicom_input ./data/output && chmod -R 777 ./data
RUN mkdir -p ./data/converted_png && chmod -R 777 ./data/converted_png

COPY models /code/models
COPY src /code/src
COPY serve /code/serve

RUN chmod +x /code/serve
ENV PATH="/code:${PATH}" \
    PYTHONUNBUFFERED=TRUE \
    PYTHONDONTWRITEBYTECODE=TRUE

EXPOSE 8080