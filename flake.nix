{
  description = "Sewing Assistant dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in {
      devShells = forAllSystems (system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_22
              python312
              uv
            ];

            shellHook = ''
              echo "frontend:  cd frontend && npm install && npm run dev"
              echo "backend:   cd backend && uv sync && uv run uvicorn main:app --reload"
            '';
          };
        }
      );
    };
}
