from pathlib import Path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from docxtpl import DocxTemplate
from django.http import FileResponse
from datetime import datetime
from io import BytesIO
from num2words import num2words

MONTHS_ES = {
    1: "ENERO",
    2: "FEBRERO",
    3: "MARZO",
    4: "ABRIL",
    5: "MAYO",
    6: "JUNIO",
    7: "JULIO",
    8: "AGOSTO",
    9: "SEPTIEMBRE",
    10: "OCTUBRE",
    11: "NOVIEMBRE",
    12: "DICIEMBRE",
}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_contract(request):

    # Get the data from the request
    template_name = request.data.get('template')
    contract_number = request.data.get('contractNumber')
    contract_date = request.data.get('contractDate')
    persons = request.data.get('persons')

    # Check if the inputs are valid
    if not template_name:
        return Response(
            {"error": "La plantilla de contrato es requerida"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not contract_number:
        return Response(
            {"error": "El numero de contrato es requerido"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not contract_date:
        return Response(
            {"error": "La fecha de contrato es requerida"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not persons:
        return Response(
            {"error": "Los datos de las personas son requeridos"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Path to templates folder inside the app
    base_path = Path(__file__).resolve().parent
    template_path = base_path / "contract_templates" / f"{template_name}.docx"

    if not template_path.exists():
        return Response(
            {"error": "La plantilla de contrato no fue encontrada"},
            status=status.HTTP_404_NOT_FOUND
        )

    doc = DocxTemplate(template_path)

    context = {
        "contract_number": contract_number,
        "contract_date": format_contract_date(contract_date),
        "tenants": format_persons(persons),
        "number_of_tenants": len(persons),
        "number_of_tenants_str": num2words(len(persons), lang="es"),

    }

    doc.render(context)

    # Create the file in memory
    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    buffer = restrict_docx_editing(buffer, password="admin123")

    return FileResponse(
        buffer,
        as_attachment=True,
        filename="contract.docx",
        content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

def format_contract_date(date_str: str) -> str:
    """
    Convert YYYY-MM-DD to legal contract format:
    11 DE MARZO DE 2026
    """
    print(date_str)
    date_obj = datetime.strptime(date_str, "%Y-%m-%d")

    day = date_obj.day
    month = MONTHS_ES[date_obj.month]
    year = date_obj.year

    return f"{day} DE {month} DE {year}"

def format_persons(persons: list) -> list:
    """
    Format the persons data to the legal contract format
    """
    tenants = []
    for tenant in persons:
        name = tenant["nombreCompleto"]
        document_type = tenant["tipoDocumento"]
        document_number = tenant["documento"]
        place_of_expedition = tenant["lugarExpedicion"]

        tenants.append(f"{name}, con {document_type} N° {document_number} de {place_of_expedition}")
    
    tenants_str = ", ".join(tenants)
    return tenants_str

import zipfile
import base64
import os
import hashlib
from io import BytesIO
import struct


def restrict_docx_editing(docx_buffer: BytesIO, password="admin123") -> BytesIO:

    spin_count = 100000
    salt = os.urandom(16)

    password_bytes = password.encode("utf-16le")

    hash_value = hashlib.sha1(salt + password_bytes).digest()

    for i in range(spin_count):
        hash_value = hashlib.sha1(hash_value + struct.pack("<I", i)).digest()

    hash_b64 = base64.b64encode(hash_value).decode()
    salt_b64 = base64.b64encode(salt).decode()

    input_zip = zipfile.ZipFile(docx_buffer)
    output_buffer = BytesIO()

    with zipfile.ZipFile(output_buffer, "w", zipfile.ZIP_DEFLATED) as output_zip:
        for item in input_zip.infolist():
            data = input_zip.read(item.filename)

            if item.filename == "word/settings.xml":
                settings_xml = data.decode("utf-8")

                protection_tag = f"""
<w:documentProtection 
    w:edit="readOnly"
    w:enforcement="1"
    w:cryptProviderType="rsaFull"
    w:cryptAlgorithmClass="hash"
    w:cryptAlgorithmType="typeAny"
    w:cryptAlgorithmSid="4"
    w:cryptSpinCount="{spin_count}"
    w:hash="{hash_b64}"
    w:salt="{salt_b64}"
    xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>
"""

                settings_xml = settings_xml.replace(
                    "</w:settings>",
                    protection_tag + "</w:settings>"
                )

                data = settings_xml.encode("utf-8")

            output_zip.writestr(item, data)

    output_buffer.seek(0)
    return output_buffer