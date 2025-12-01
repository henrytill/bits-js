{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    utils.url = "github:numtide/flake-utils";
  };
  outputs =
    {
      self,
      nixpkgs,
      utils,
    }:
    utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        src = builtins.path {
          path = ./.;
          name = "noematic-src";
        };
        npmRoot = src;
        bits = pkgs.buildNpmPackage {
          pname = "bits";
          version = "0.1.0";
          inherit src;

          npmDeps = pkgs.importNpmLock { inherit npmRoot; };

          npmConfigHook = pkgs.importNpmLock.npmConfigHook;

          dontNpmBuild = true;
        };
      in
      {
        packages.default = bits;
        devShell = pkgs.mkShell {
          packages = with pkgs; [
            importNpmLock.hooks.linkNodeModulesHook
            nodejs
            yaml-language-server
          ];
          npmDeps = pkgs.importNpmLock.buildNodeModules {
            inherit npmRoot;
            inherit (pkgs) nodejs;
          };
        };
      }
    );
}
