import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory

from companies.models import Company
from users.permissions import IsCompanyAdmin, IsPlatformAdmin, UserMultiTenantPermission
from users.serializers import CustomTokenObtainPairSerializer, UserSerializer
from users.views import UserViewSet


User = get_user_model()


@pytest.fixture
def company_a(db):
    return Company.objects.create(name="Inmo A")


@pytest.fixture
def company_b(db):
    return Company.objects.create(name="Inmo B")


@pytest.fixture
def platform_admin(db):
    return User.objects.create_user(
        username="platform",
        password="StrongPass123",
        first_name="Plat",
        last_name="Form",
        role="admin",
        is_platform_admin=True,
        is_staff=True,
    )


@pytest.fixture
def company_admin_a(db, company_a):
    return User.objects.create_user(
        username="admin_a",
        password="StrongPass123",
        first_name="Admin",
        last_name="A",
        role="admin",
        company=company_a,
        is_staff=True,
    )


@pytest.fixture
def promotor_a(db, company_a):
    return User.objects.create_user(
        username="promotor_a",
        password="StrongPass123",
        first_name="Pro",
        last_name="A",
        role="promotor",
        company=company_a,
    )


@pytest.fixture
def promotor_b(db, company_b):
    return User.objects.create_user(
        username="promotor_b",
        password="StrongPass123",
        first_name="Pro",
        last_name="B",
        role="promotor",
        company=company_b,
    )


@pytest.mark.django_db
class TestUserModelAndSerializer:
    def test_user_str_returns_username(self, promotor_a):
        assert str(promotor_a) == "promotor_a"

    def test_user_defaults_role_and_platform_flag(self):
        u = User(username="new_user")
        assert u.role == "promotor"
        assert u.is_platform_admin is False

    def test_serializer_create_hashes_password_and_sets_staff_for_admin(self, company_a):
        data = {
            "username": "admin_new",
            "first_name": "Admin",
            "last_name": "Nuevo",
            "role": "admin",
            "company": company_a.id,
            "password": "StrongPass123",
        }
        serializer = UserSerializer(data=data, context={"request": None})
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        assert user.is_staff is True
        assert user.password != "StrongPass123"
        assert user.check_password("StrongPass123")

    def test_serializer_create_promotor_not_staff(self, company_a):
        data = {
            "username": "promo_new",
            "first_name": "Pro",
            "last_name": "Nuevo",
            "role": "promotor",
            "company": company_a.id,
            "password": "StrongPass123",
        }
        serializer = UserSerializer(data=data, context={"request": None})
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        assert user.is_staff is False

    def test_serializer_requires_password_on_create(self, company_a):
        data = {
            "username": "no_pass",
            "first_name": "No",
            "last_name": "Pass",
            "role": "promotor",
            "company": company_a.id,
        }
        serializer = UserSerializer(data=data, context={"request": None})
        assert not serializer.is_valid()
        assert "password" in serializer.errors

    def test_serializer_platform_admin_requires_company_on_create(self, platform_admin):
        factory = APIRequestFactory()
        request = factory.post("/api/users/")
        request.user = platform_admin
        data = {
            "username": "tenantless",
            "first_name": "No",
            "last_name": "Company",
            "role": "promotor",
            "password": "StrongPass123",
        }
        serializer = UserSerializer(data=data, context={"request": request})
        assert not serializer.is_valid()
        assert "company" in serializer.errors

    def test_serializer_update_changes_password_when_provided(self, promotor_a):
        serializer = UserSerializer(
            instance=promotor_a,
            data={"first_name": "Updated", "password": "ChangedPass123"},
            partial=True,
            context={"request": None},
        )
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        assert user.first_name == "Updated"
        assert user.check_password("ChangedPass123")

    def test_serializer_update_recomputes_staff_from_role_and_platform(self, promotor_a):
        serializer = UserSerializer(
            instance=promotor_a,
            data={"role": "admin"},
            partial=True,
            context={"request": None},
        )
        assert serializer.is_valid(), serializer.errors
        user = serializer.save()
        assert user.is_staff is True

    def test_token_serializer_validate_returns_user_payload(self, promotor_a):
        serializer = CustomTokenObtainPairSerializer(
            data={"username": "promotor_a", "password": "StrongPass123"}
        )
        assert serializer.is_valid(), serializer.errors
        payload = serializer.validated_data
        assert "access" in payload
        assert "refresh" in payload
        assert "user" in payload
        assert payload["user"]["username"] == "promotor_a"


@pytest.mark.django_db
class TestPermissions:
    def test_is_platform_admin_permission(self, platform_admin, promotor_a):
        perm = IsPlatformAdmin()
        req = APIRequestFactory().get("/api/companies/")
        req.user = platform_admin
        assert perm.has_permission(req, None) is True
        req.user = promotor_a
        assert perm.has_permission(req, None) is False

    def test_is_company_admin_permission(self, company_admin_a, platform_admin, promotor_a):
        perm = IsCompanyAdmin()
        req = APIRequestFactory().get("/api/users/")
        req.user = company_admin_a
        assert perm.has_permission(req, None) is True
        req.user = platform_admin
        assert perm.has_permission(req, None) is False
        req.user = promotor_a
        assert perm.has_permission(req, None) is False

    def test_user_multitenant_has_permission_rules(self, company_admin_a, promotor_a):
        perm = UserMultiTenantPermission()
        view = type("V", (), {"action": "create"})()
        req = APIRequestFactory().post("/api/users/")
        req.user = company_admin_a
        assert perm.has_permission(req, view) is True

        req.user = promotor_a
        assert perm.has_permission(req, view) is False

    def test_user_multitenant_object_permission_for_promotor_self(self, promotor_a):
        perm = UserMultiTenantPermission()
        req = APIRequestFactory().patch("/api/users/me/")
        req.user = promotor_a
        view = type("V", (), {"action": "partial_update"})()
        assert perm.has_object_permission(req, view, promotor_a) is True

    def test_user_multitenant_object_permission_for_company_admin_other_tenant(
        self, company_admin_a, promotor_b
    ):
        perm = UserMultiTenantPermission()
        req = APIRequestFactory().get("/api/users/")
        req.user = company_admin_a
        view = type("V", (), {"action": "retrieve"})()
        assert perm.has_object_permission(req, view, promotor_b) is False


@pytest.mark.django_db
class TestUserEndpoints:
    def test_login_success_returns_tokens(self, api_client, promotor_a):
        res = api_client.post(
            "/api/auth/login/",
            {"username": "promotor_a", "password": "StrongPass123"},
            format="json",
        )
        assert res.status_code == 200
        assert "access" in res.data
        assert "refresh" in res.data
        assert res.data["user"]["username"] == "promotor_a"

    def test_login_invalid_credentials_returns_401(self, api_client, promotor_a):
        res = api_client.post(
            "/api/auth/login/",
            {"username": "promotor_a", "password": "wrong"},
            format="json",
        )
        assert res.status_code == 401

    def test_me_requires_auth(self, api_client):
        res = api_client.get("/api/auth/me/")
        assert res.status_code == 401

    def test_me_returns_current_user(self, api_client, promotor_a):
        api_client.force_authenticate(user=promotor_a)
        res = api_client.get("/api/auth/me/")
        assert res.status_code == 200
        assert res.data["username"] == "promotor_a"

    def test_users_list_requires_auth(self, api_client):
        res = api_client.get("/api/users/")
        assert res.status_code == 401

    def test_platform_admin_lists_all_users(
        self, api_client, platform_admin, company_admin_a, promotor_a, promotor_b
    ):
        api_client.force_authenticate(user=platform_admin)
        res = api_client.get("/api/users/")
        assert res.status_code == 200
        usernames = {u["username"] for u in res.data}
        assert {"platform", "admin_a", "promotor_a", "promotor_b"} <= usernames

    def test_company_admin_lists_only_company_users(
        self, api_client, company_admin_a, promotor_a, promotor_b
    ):
        api_client.force_authenticate(user=company_admin_a)
        res = api_client.get("/api/users/")
        assert res.status_code == 200
        usernames = {u["username"] for u in res.data}
        assert "admin_a" in usernames
        assert "promotor_a" in usernames
        assert "promotor_b" not in usernames

    def test_promotor_lists_only_self(self, api_client, promotor_a, promotor_b):
        api_client.force_authenticate(user=promotor_a)
        res = api_client.get("/api/users/")
        assert res.status_code == 200
        assert len(res.data) == 1
        assert res.data[0]["username"] == "promotor_a"

    def test_company_admin_create_auto_assigns_own_company(
        self, api_client, company_admin_a, company_b
    ):
        api_client.force_authenticate(user=company_admin_a)
        res = api_client.post(
            "/api/users/",
            {
                "username": "created_by_admin",
                "first_name": "Created",
                "last_name": "ByAdmin",
                "role": "promotor",
                "company": company_b.id,
                "password": "StrongPass123",
            },
            format="json",
        )
        assert res.status_code == 201, res.data
        created = User.objects.get(username="created_by_admin")
        assert created.company_id == company_admin_a.company_id

    def test_platform_admin_create_requires_company(self, api_client, platform_admin):
        api_client.force_authenticate(user=platform_admin)
        res = api_client.post(
            "/api/users/",
            {
                "username": "created_by_platform",
                "first_name": "Created",
                "last_name": "Platform",
                "role": "promotor",
                "password": "StrongPass123",
            },
            format="json",
        )
        assert res.status_code == 400
        assert "company" in res.data

    def test_promotor_cannot_create_user(self, api_client, promotor_a):
        api_client.force_authenticate(user=promotor_a)
        res = api_client.post(
            "/api/users/",
            {
                "username": "should_fail",
                "first_name": "No",
                "last_name": "Perm",
                "role": "promotor",
                "password": "StrongPass123",
            },
            format="json",
        )
        assert res.status_code == 403

    def test_company_admin_cannot_retrieve_other_tenant_user(
        self, api_client, company_admin_a, promotor_b
    ):
        api_client.force_authenticate(user=company_admin_a)
        res = api_client.get(f"/api/users/{promotor_b.id}/")
        assert res.status_code == 404

    def test_company_admin_can_update_user_in_same_company(
        self, api_client, company_admin_a, promotor_a
    ):
        api_client.force_authenticate(user=company_admin_a)
        res = api_client.patch(
            f"/api/users/{promotor_a.id}/",
            {"first_name": "Updated"},
            format="json",
        )
        assert res.status_code == 200, res.data
        promotor_a.refresh_from_db()
        assert promotor_a.first_name == "Updated"

    def test_promotor_can_update_self(self, api_client, promotor_a):
        api_client.force_authenticate(user=promotor_a)
        res = api_client.patch(
            f"/api/users/{promotor_a.id}/",
            {"last_name": "Updated"},
            format="json",
        )
        assert res.status_code == 200
        promotor_a.refresh_from_db()
        assert promotor_a.last_name == "Updated"

    def test_promotor_cannot_delete_user(self, api_client, promotor_a):
        api_client.force_authenticate(user=promotor_a)
        res = api_client.delete(f"/api/users/{promotor_a.id}/")
        assert res.status_code == 403

    def test_company_admin_can_delete_user_in_same_company(
        self, api_client, company_admin_a, promotor_a
    ):
        api_client.force_authenticate(user=company_admin_a)
        res = api_client.delete(f"/api/users/{promotor_a.id}/")
        assert res.status_code == 204
        assert not User.objects.filter(id=promotor_a.id).exists()

    def test_viewset_queryset_for_roles(self, platform_admin, company_admin_a, promotor_a, promotor_b):
        factory = APIRequestFactory()
        view = UserViewSet()

        req_platform = factory.get("/api/users/")
        req_platform.user = platform_admin
        view.request = req_platform
        qs = view.get_queryset()
        assert set(qs.values_list("username", flat=True)) >= {
            "platform",
            "admin_a",
            "promotor_a",
            "promotor_b",
        }

        req_admin = factory.get("/api/users/")
        req_admin.user = company_admin_a
        view.request = req_admin
        qs = view.get_queryset()
        assert "promotor_a" in set(qs.values_list("username", flat=True))
        assert "promotor_b" not in set(qs.values_list("username", flat=True))

        req_promotor = factory.get("/api/users/")
        req_promotor.user = promotor_a
        view.request = req_promotor
        qs = view.get_queryset()
        assert list(qs.values_list("username", flat=True)) == ["promotor_a"]
