import os

def split_file(filename, chunk_size=300*1024):
    """
    Divide un archivo en partes de tamaño fijo (por defecto 300 KB).
    
    :param filename: Nombre del archivo original.
    :param chunk_size: Tamaño de cada fragmento en bytes.
    """
    if not os.path.exists(filename):
        print(f"❌ El archivo {filename} no existe.")
        return

    with open(filename, "rb") as f:  # abrir en binario
        part_num = 1
        while True:
            chunk = f.read(chunk_size)
            if not chunk:
                break
            new_filename = f"{filename}_part{part_num}.txt"
            with open(new_filename, "wb") as chunk_file:
                chunk_file.write(chunk)
            print(f"✅ Archivo creado: {new_filename} ({len(chunk)} bytes)")
            part_num += 1


if __name__ == "__main__":
    # Cambia 'dic.txt' si tu archivo tiene otro nombre
    split_file("dic.txt")
