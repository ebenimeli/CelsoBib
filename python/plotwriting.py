import pandas as pd
data = pd.read_csv('writing.txt',sep='\s+',header=None)
data = pd.DataFrame(data)

import matplotlib.pyplot as plt
x = data[0]
y = data[1]
z = data[2]
plt.bar(x,z);
plt.plot(x, y,'r--')

plt.xlabel("días desde el 12/11/2022");
plt.ylabel("palabras");


plt.savefig('writing.png')
#plt.show();
