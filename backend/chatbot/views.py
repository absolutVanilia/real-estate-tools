from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import ChatMessageSerializer
from .services.openai_service import ask_llm


class ChatbotView(APIView):
    def post(self, request):
        serializer = ChatMessageSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message = serializer.validated_data["message"]

        try:
            reply = ask_llm(message)

            return Response({
                "reply": reply
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )